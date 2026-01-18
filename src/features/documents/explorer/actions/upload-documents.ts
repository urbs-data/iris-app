'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getBlobContainer } from '@/lib/azure-blob';
import { uploadDocumentsSchema } from './upload-documents-schema';
import { resolveETLProcessor } from '../lib/etl/registry';
import type { FileMetadata } from '../lib/types';

function generateBlobPath(
  date: Date,
  classification: string,
  subClassification: string | undefined,
  area: string | undefined,
  fileName: string
): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  const parts = [year, month, classification];

  if (subClassification) {
    parts.push(subClassification);
  }

  if (area) {
    parts.push(area);
  }

  parts.push(fileName);

  return parts.join('/');
}

export const uploadDocuments = authOrganizationActionClient
  .metadata({ actionName: 'uploadDocuments' })
  .inputSchema(uploadDocumentsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const container = getBlobContainer();
    const results: Array<{
      fileName: string;
      uploaded: boolean;
      etlProcessed: boolean;
      etlResult?: {
        success: boolean;
        errors: string[];
        stats: {
          rowsParsed: number;
          deleted: number;
          inserted: number;
        };
      };
      error?: string;
    }> = [];

    for (const file of parsedInput.files) {
      const fileName = file.name;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const processor = resolveETLProcessor({
          db: ctx.db,
          buffer,
          fileName,
          classification: parsedInput.classification,
          subClassification: parsedInput.subClassification
        });

        if (processor) {
          const etlResult = await processor.process({
            db: ctx.db,
            buffer,
            fileName,
            classification: parsedInput.classification,
            subClassification: parsedInput.subClassification
          });

          if (!etlResult.success) {
            results.push({
              fileName,
              uploaded: false,
              etlProcessed: true,
              etlResult,
              error: 'ETL falló, archivo no subido'
            });
            continue;
          }

          results.push({
            fileName,
            uploaded: false,
            etlProcessed: true,
            etlResult
          });
        }

        const blobPath = generateBlobPath(
          parsedInput.date,
          parsedInput.classification,
          parsedInput.subClassification,
          parsedInput.area,
          fileName
        );

        const blockBlobClient = container.getBlockBlobClient(blobPath);
        await blockBlobClient.upload(buffer, buffer.length, {
          blobHTTPHeaders: {
            blobContentType: file.type
          }
        });

        const user = ctx.session.user;
        const fullName = [user.firstName, user.lastName]
          .filter(Boolean)
          .join(' ');

        const metadata: FileMetadata = {
          year: parsedInput.date.getFullYear().toString(),
          month: (parsedInput.date.getMonth() + 1).toString().padStart(2, '0'),
          classification: parsedInput.classification,
          sub_classification: parsedInput.subClassification || null,
          date: parsedInput.date.toISOString(),
          area: parsedInput.area || null,
          filename: fileName,
          uploaded_by: fullName || user.email || 'Usuario',
          upload_date: new Date().toISOString(),
          extension: fileName.split('.').pop() || ''
        };

        const metadataBlobClient = container.getBlockBlobClient(
          `${blobPath}.metadata.json`
        );
        await metadataBlobClient.upload(
          JSON.stringify(metadata, null, 2),
          JSON.stringify(metadata, null, 2).length,
          {
            blobHTTPHeaders: {
              blobContentType: 'application/json'
            }
          }
        );

        const currentResult = results.find((r) => r.fileName === fileName);
        if (currentResult) {
          currentResult.uploaded = true;
        } else {
          results.push({
            fileName,
            uploaded: true,
            etlProcessed: false
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        results.push({
          fileName,
          uploaded: false,
          etlProcessed: false,
          error: message
        });
      }
    }

    const hasErrors = results.some(
      (r) => !r.uploaded || r.etlResult?.success === false
    );

    const etlErrors = results
      .filter((r) => r.etlResult && !r.etlResult.success)
      .flatMap((r) => r.etlResult!.errors);

    return {
      success: !hasErrors,
      message: hasErrors
        ? 'uploadDocument.uploadPartialSuccess'
        : 'uploadDocument.uploadSuccess',
      results,
      etlErrors
    };
  });
