import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  estudiosTable,
  documentosTable,
  estudiosPozosTable,
  muestrasTable,
  concentracionesTable,
  type NewEstudio,
  type NewDocumento,
  type NewEstudioPozo,
  type NewMuestra,
  type NewConcentracion
} from '@/db/schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = NodePgDatabase<any>;

/**
 * Inserta o actualiza estudios
 */
export async function upsertEstudios(
  db: DbClient,
  estudios: NewEstudio[]
): Promise<number> {
  if (estudios.length === 0) return 0;

  const result = await db
    .insert(estudiosTable)
    .values(estudios)
    .onConflictDoUpdate({
      target: estudiosTable.id_estudio,
      set: {
        proveedor: estudiosTable.proveedor,
        informe_final: estudiosTable.informe_final,
        fecha_desde: estudiosTable.fecha_desde,
        fecha_hasta: estudiosTable.fecha_hasta
      }
    })
    .returning({ id: estudiosTable.id_estudio });

  return result.length;
}

/**
 * Inserta o actualiza documentos
 */
export async function upsertDocumentos(
  db: DbClient,
  documentos: NewDocumento[]
): Promise<number> {
  if (documentos.length === 0) return 0;

  const result = await db
    .insert(documentosTable)
    .values(documentos)
    .onConflictDoUpdate({
      target: documentosTable.id_documento,
      set: {
        id_estudio: documentosTable.id_estudio,
        documento: documentosTable.documento
      }
    })
    .returning({ id: documentosTable.id_documento });

  return result.length;
}

/**
 * Inserta o actualiza estudios-pozos
 */
export async function upsertEstudiosPozos(
  db: DbClient,
  estudiosPozos: NewEstudioPozo[]
): Promise<number> {
  if (estudiosPozos.length === 0) return 0;

  const result = await db
    .insert(estudiosPozosTable)
    .values(estudiosPozos)
    .onConflictDoUpdate({
      target: estudiosPozosTable.id_estudio_pozo,
      set: {
        id_estudio: estudiosPozosTable.id_estudio,
        id_pozo: estudiosPozosTable.id_pozo
      }
    })
    .returning({ id: estudiosPozosTable.id_estudio_pozo });

  return result.length;
}

/**
 * Inserta o actualiza muestras
 */
export async function upsertMuestras(
  db: DbClient,
  muestras: NewMuestra[]
): Promise<number> {
  if (muestras.length === 0) return 0;

  const result = await db
    .insert(muestrasTable)
    .values(muestras)
    .onConflictDoUpdate({
      target: muestrasTable.id_muestra,
      set: {
        muestra: muestrasTable.muestra,
        id_estudio_pozo: muestrasTable.id_estudio_pozo,
        tipo: muestrasTable.tipo,
        profundidad: muestrasTable.profundidad,
        fecha: muestrasTable.fecha
      }
    })
    .returning({ id: muestrasTable.id_muestra });

  return result.length;
}

/**
 * Inserta concentraciones (sin upsert, ya que se eliminaron previamente)
 */
export async function insertConcentraciones(
  db: DbClient,
  concentraciones: NewConcentracion[]
): Promise<number> {
  if (concentraciones.length === 0) return 0;

  // Insertar en batches de 1000 para evitar límites de PostgreSQL
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < concentraciones.length; i += BATCH_SIZE) {
    const batch = concentraciones.slice(i, i + BATCH_SIZE);

    const result = await db
      .insert(concentracionesTable)
      .values(batch)
      .onConflictDoNothing()
      .returning({ id: concentracionesTable.id_concentracion });

    inserted += result.length;
  }

  return inserted;
}
