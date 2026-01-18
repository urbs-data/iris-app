import { eq, notInArray, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  concentracionesTable,
  muestrasTable,
  estudiosPozosTable,
  documentosTable,
  estudiosTable
} from '@/db/schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = NodePgDatabase<any>;

/**
 * Elimina todos los datos asociados a un documento y limpia entidades huérfanas.
 *
 * Orden de eliminación:
 * 1. Concentraciones con documento_origen = fileName
 * 2. Muestras sin concentraciones
 * 3. Estudios-Pozos sin muestras
 * 4. Documentos sin estudios-pozos asociados al mismo estudio
 * 5. Estudios sin documentos
 */
export async function deleteDocumentData(
  db: DbClient,
  documentoOrigen: string
): Promise<{
  deletedConcentraciones: number;
  deletedMuestras: number;
  deletedEstudiosPozos: number;
  deletedDocumentos: number;
  deletedEstudios: number;
}> {
  // 1. Eliminar concentraciones del documento
  const deletedConcentraciones = await db
    .delete(concentracionesTable)
    .where(eq(concentracionesTable.documento_origen, documentoOrigen))
    .returning({ id: concentracionesTable.id_concentracion });

  // 2. Eliminar muestras huérfanas (sin concentraciones)
  const muestrasConConcentraciones = db
    .select({ id: concentracionesTable.id_muestra })
    .from(concentracionesTable);

  const deletedMuestras = await db
    .delete(muestrasTable)
    .where(
      notInArray(
        muestrasTable.id_muestra,
        sql`(SELECT DISTINCT ${concentracionesTable.id_muestra} FROM ${concentracionesTable})`
      )
    )
    .returning({ id: muestrasTable.id_muestra });

  // 3. Eliminar estudios-pozos huérfanos (sin muestras)
  const deletedEstudiosPozos = await db
    .delete(estudiosPozosTable)
    .where(
      notInArray(
        estudiosPozosTable.id_estudio_pozo,
        sql`(SELECT DISTINCT ${muestrasTable.id_estudio_pozo} FROM ${muestrasTable})`
      )
    )
    .returning({ id: estudiosPozosTable.id_estudio_pozo });

  // 4. Eliminar documentos huérfanos (sin estudios-pozos del mismo estudio)
  // Un documento se considera huérfano si su estudio ya no tiene estudios-pozos
  const deletedDocumentos = await db
    .delete(documentosTable)
    .where(
      notInArray(
        documentosTable.id_estudio,
        sql`(SELECT DISTINCT ${estudiosPozosTable.id_estudio} FROM ${estudiosPozosTable})`
      )
    )
    .returning({ id: documentosTable.id_documento });

  // 5. Eliminar estudios huérfanos (sin documentos)
  const deletedEstudios = await db
    .delete(estudiosTable)
    .where(
      notInArray(
        estudiosTable.id_estudio,
        sql`(SELECT DISTINCT ${documentosTable.id_estudio} FROM ${documentosTable})`
      )
    )
    .returning({ id: estudiosTable.id_estudio });

  return {
    deletedConcentraciones: deletedConcentraciones.length,
    deletedMuestras: deletedMuestras.length,
    deletedEstudiosPozos: deletedEstudiosPozos.length,
    deletedDocumentos: deletedDocumentos.length,
    deletedEstudios: deletedEstudios.length
  };
}
