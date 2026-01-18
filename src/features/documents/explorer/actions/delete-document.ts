'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getBlobContainer } from '@/lib/azure-blob';
import { deleteDocumentSchema } from './delete-document-schema';
import { SubClassification } from '../constants/classifications';
import { deleteDocumentData } from '../data/delete-document-data';
import { isExcelFile } from '../lib/parsing/utils';
import type { FileMetadata } from '../lib/types';

/**
 * Determina si el archivo debe ser procesado para eliminar datos de BD
 */
function shouldDeleteDatabaseData(
  subClassification: string | null | undefined,
  fileName: string
): boolean {
  if (!subClassification || !fileName) return false;

  return (
    (subClassification === SubClassification.MuestrasSuelo ||
      subClassification === SubClassification.MuestrasAgua) &&
    isExcelFile(fileName)
  );
}

/**
 * Descarga y parsea la metadata de un archivo
 */
async function getFileMetadata(
  container: ReturnType<typeof getBlobContainer>,
  blobPath: string
): Promise<FileMetadata | null> {
  try {
    const metadataBlob = container.getBlobClient(`${blobPath}.metadata.json`);
    const downloadResponse = await metadataBlob.download();

    if (!downloadResponse.readableStreamBody) {
      return null;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    return JSON.parse(buffer.toString()) as FileMetadata;
  } catch {
    return null;
  }
}

export const deleteDocument = authOrganizationActionClient
  .metadata({ actionName: 'deleteDocument' })
  .inputSchema(deleteDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { blobPath } = parsedInput;
    const container = getBlobContainer();

    try {
      // 1. Obtener metadata del archivo para determinar si necesita limpieza de BD
      const metadata = await getFileMetadata(container, blobPath);
      const fileName = metadata?.filename || blobPath.split('/').pop() || '';

      // 2. Eliminar datos de BD si es una muestra de laboratorio
      let dbDeletionStats = null;
      if (
        metadata &&
        shouldDeleteDatabaseData(metadata.sub_classification, fileName)
      ) {
        dbDeletionStats = await deleteDocumentData(ctx.db, fileName);
      }

      // 3. Eliminar el blob principal
      const blobClient = container.getBlobClient(blobPath);
      await blobClient.delete();

      // 4. Eliminar el archivo de metadata
      try {
        const metadataBlob = container.getBlobClient(
          `${blobPath}.metadata.json`
        );
        await metadataBlob.delete();
      } catch {
        // La metadata puede no existir, continuar
      }

      // 5. Eliminar directorios vacíos recursivamente
      const pathParts = blobPath.split('/');
      pathParts.pop(); // Remover el nombre del archivo
      const directoryPath = pathParts.join('/');

      // 6. Revalidar el path para refrescar la UI
      revalidatePath('/dashboard/explorer');
      if (directoryPath) {
        revalidatePath(`/dashboard/explorer?path=/${directoryPath}`);
      }

      return {
        success: true,
        message: 'Archivo eliminado correctamente',
        fileName,
        dbDeletionStats
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al eliminar el archivo: ${message}`);
    }
  });
