import crypto from 'crypto';
import type { ParsedRow } from './parsers/lab-parser';
import type {
  NewEstudio,
  NewDocumento,
  NewEstudioPozo,
  NewMuestra,
  NewConcentracion
} from '@/db/schema';

/**
 * Genera un ID hash basado en valores (replica el comportamiento de Python)
 */
function generateId(
  values: (string | number | Date | null | undefined)[]
): string {
  const str = values
    .map((v) => {
      if (v === null || v === undefined) return '';
      if (v instanceof Date) return v.toISOString();
      return String(v);
    })
    .join('|');

  return crypto.createHash('md5').update(str).digest('hex').slice(0, 16);
}

/**
 * Mapea el tipo de matriz del laboratorio a español
 */
function mapTipoMatriz(tipo: string): string {
  const mapping: Record<string, string> = {
    Soil: 'Suelo',
    Water: 'Agua',
    GW: 'Agua'
  };
  return mapping[tipo] || tipo;
}

/**
 * Extrae el ID del pozo del nombre de la muestra
 * Ejemplos:
 * - "TB-123456" -> "TB"
 * - "EB-123456" -> "EB"
 * - "MW-01-123" -> "01"
 * - "GW-15-456" -> "15"
 */
function extractPozoId(muestra: string): string | null {
  const trimmed = muestra.trim();

  // Casos especiales: Trip Blank o Equipment Blank
  if (trimmed.startsWith('TB-')) return 'TB';
  if (trimmed.startsWith('EB-')) return 'EB';

  // Formato general: TIPO-POZO-RESTO
  const parts = trimmed.split('-');
  if (parts.length > 1) {
    return parts[1].trim() || null;
  }

  return null;
}

/**
 * Intenta parsear la profundidad del nombre de la muestra
 * El tercer segmento suele ser la profundidad (ej: MW-01-1.5)
 */
function extractProfundidad(muestra: string): number | null {
  const parts = muestra.split('-');
  if (parts.length > 2) {
    const num = parseFloat(parts[2]);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Intenta parsear la fecha de la muestra del nombre
 */
function extractFechaMuestra(
  muestra: string,
  fechaDesde: Date | null
): Date | null {
  const trimmed = muestra.trim();

  try {
    // Casos con TRIP BLANK o EQUIPMENT BLANK: TB-123456 o EB-123456
    // El formato es MMDDYY
    if (trimmed.startsWith('TB-') || trimmed.startsWith('EB-')) {
      const dateStr = trimmed.slice(3, 9);
      if (dateStr.length === 6) {
        const month = parseInt(dateStr.slice(0, 2), 10);
        const day = parseInt(dateStr.slice(2, 4), 10);
        const year = parseInt(dateStr.slice(4, 6), 10);
        const fullYear = year > 50 ? 1900 + year : 2000 + year;
        return new Date(fullYear, month - 1, day);
      }
    }

    // Casos con "eventos": E01GW1224 -> mes=12, año=24
    if (
      trimmed.startsWith('E') &&
      trimmed.length > 2 &&
      /^\d{2}/.test(trimmed.slice(1, 3))
    ) {
      const mes = parseInt(trimmed.slice(5, 7), 10);
      const anio = parseInt(trimmed.slice(7, 9), 10);
      if (!isNaN(mes) && !isNaN(anio)) {
        const fullYear = anio > 50 ? 1900 + anio : 2000 + anio;
        return new Date(fullYear, mes - 1, 1);
      }
    }

    // Formato estándar: XXYYMM... -> extraer mes y año de posiciones 2-6
    if (trimmed.length >= 6) {
      const mes = parseInt(trimmed.slice(2, 4), 10);
      const anio = parseInt(trimmed.slice(4, 6), 10);
      if (!isNaN(mes) && !isNaN(anio) && mes >= 1 && mes <= 12) {
        const fullYear = anio > 50 ? 1900 + anio : 2000 + anio;
        return new Date(fullYear, mes - 1, 1);
      }
    }
  } catch {
    // Si falla el parseo, usar fecha_desde
  }

  // Fallback: usar fecha_desde con día 1
  if (fechaDesde) {
    return new Date(fechaDesde.getFullYear(), fechaDesde.getMonth(), 1);
  }

  return null;
}

/**
 * Resultado de la extracción de entidades
 */
export interface ExtractedEntities {
  estudios: NewEstudio[];
  documentos: NewDocumento[];
  estudiosPozos: NewEstudioPozo[];
  muestras: NewMuestra[];
  concentraciones: NewConcentracion[];
}

/**
 * Datos intermedios enriquecidos con IDs generados
 */
interface EnrichedRow extends ParsedRow {
  id_estudio: string;
  id_documento: string;
  id_pozo: string | null;
  id_estudio_pozo: string;
  id_muestra: string;
  id_concentracion: string;
  tipo_mapped: string;
  profundidad: number | null;
  fecha_muestra: Date | null;
}

/**
 * Extrae todas las entidades de las filas parseadas del Excel
 */
export function extractEntities(
  rows: ParsedRow[],
  organizationId: string
): ExtractedEntities {
  // Paso 1: Enriquecer filas con IDs calculados
  const enrichedRows: EnrichedRow[] = rows.map((row) => {
    // Generar id_estudio
    const id_estudio = generateId([
      row.proveedor,
      row.informe_final,
      row.fecha_desde,
      row.fecha_hasta
    ]);

    // Extraer id_pozo del nombre de muestra
    const id_pozo = extractPozoId(row.muestra);

    // Generar id_estudio_pozo
    const id_estudio_pozo = generateId([id_estudio, id_pozo]);

    // Generar id_muestra
    const id_muestra = generateId([row.muestra, id_estudio_pozo]);

    // Generar id_concentracion
    const id_concentracion = generateId([
      id_muestra,
      row.id_sustancia,
      row.metodo
    ]);

    // Generar id_documento
    const id_documento = generateId([id_estudio, row.documento_origen]);

    return {
      ...row,
      id_estudio,
      id_documento,
      id_pozo,
      id_estudio_pozo,
      id_muestra,
      id_concentracion,
      tipo_mapped: mapTipoMatriz(row.tipo),
      profundidad: extractProfundidad(row.muestra),
      fecha_muestra: extractFechaMuestra(row.muestra, row.fecha_desde)
    };
  });

  // Paso 2: Extraer entidades únicas

  // Estudios (únicos por id_estudio)
  const estudiosMap = new Map<string, NewEstudio>();
  for (const row of enrichedRows) {
    if (!estudiosMap.has(row.id_estudio)) {
      estudiosMap.set(row.id_estudio, {
        id_estudio: row.id_estudio,
        organization_id: organizationId,
        proveedor: row.proveedor,
        informe_final: row.informe_final,
        fecha_desde: row.fecha_desde,
        fecha_hasta: row.fecha_hasta
      });
    }
  }

  // Documentos (únicos por id_documento)
  const documentosMap = new Map<string, NewDocumento>();
  for (const row of enrichedRows) {
    if (!documentosMap.has(row.id_documento)) {
      documentosMap.set(row.id_documento, {
        id_documento: row.id_documento,
        organization_id: organizationId,
        id_estudio: row.id_estudio,
        documento: row.documento_origen
      });
    }
  }

  // Estudios-Pozos (únicos por id_estudio_pozo)
  const estudiosPozosMap = new Map<string, NewEstudioPozo>();
  for (const row of enrichedRows) {
    if (!estudiosPozosMap.has(row.id_estudio_pozo)) {
      estudiosPozosMap.set(row.id_estudio_pozo, {
        id_estudio_pozo: row.id_estudio_pozo,
        organization_id: organizationId,
        id_estudio: row.id_estudio,
        id_pozo: row.id_pozo // Puede ser null si el pozo no existe
      });
    }
  }

  // Muestras (únicas por id_muestra)
  const muestrasMap = new Map<string, NewMuestra>();
  for (const row of enrichedRows) {
    if (!muestrasMap.has(row.id_muestra)) {
      muestrasMap.set(row.id_muestra, {
        id_muestra: row.id_muestra,
        organization_id: organizationId,
        muestra: row.muestra,
        id_estudio_pozo: row.id_estudio_pozo,
        tipo: row.tipo_mapped,
        profundidad: row.profundidad,
        fecha: row.fecha_muestra
      });
    }
  }

  // Concentraciones (únicas por id_concentracion, filtrar sin id_sustancia)
  const concentracionesMap = new Map<string, NewConcentracion>();
  for (const row of enrichedRows) {
    // Filtrar filas sin sustancia
    if (!row.id_sustancia) continue;

    if (!concentracionesMap.has(row.id_concentracion)) {
      concentracionesMap.set(row.id_concentracion, {
        id_concentracion: row.id_concentracion,
        organization_id: organizationId,
        id_muestra: row.id_muestra,
        fecha_laboratorio: row.fecha_laboratorio,
        metodologia_muestreo: row.metodologia_muestreo,
        protocolo: row.protocolo,
        id_sustancia: row.id_sustancia,
        metodo: row.metodo,
        unidad: row.unidad,
        limite_deteccion: row.limite_deteccion,
        limite_cuantificacion: null,
        concentracion: row.concentracion,
        documento_origen: row.documento_origen
      });
    }
  }

  return {
    estudios: Array.from(estudiosMap.values()),
    documentos: Array.from(documentosMap.values()),
    estudiosPozos: Array.from(estudiosPozosMap.values()),
    muestras: Array.from(muestrasMap.values()),
    concentraciones: Array.from(concentracionesMap.values())
  };
}
