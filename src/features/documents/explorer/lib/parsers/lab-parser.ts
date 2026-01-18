import {
  parseNumber,
  parseExcelDate,
  validateRequiredColumns,
  readExcelFirstSheet
} from '../parsing/utils';

const REQUIRED_COLUMNS = [
  'SITE_ID',
  'PARAMETER_NAME',
  'PARAMETER_CODE',
  'LAB_ID',
  'FIELD_SAMPLE_ID',
  'ANALYTICAL_METHOD',
  'ANALYSIS_DATE',
  'LAB_RESULT',
  'LAB_UNITS',
  'LAB_DETECTION_LIMIT',
  'LAB_MATRIX',
  'LAB_SAMPLE_ID'
] as const;

export interface ParsedRow {
  id_sitio: string;
  id_sustancia: string;
  sustancia: string;
  proveedor: string;
  muestra: string;
  metodo: string;
  fecha_laboratorio: Date | null;
  concentracion: number | null;
  unidad: string;
  limite_deteccion: string;
  tipo: string;
  protocolo: string;
  documento_origen: string;
  informe_final: string;
  metodologia_muestreo: string;
  fecha_desde: Date | null;
  fecha_hasta: Date | null;
}

export interface ParseResult {
  success: boolean;
  rows: ParsedRow[];
  errors: string[];
}

export function parseLabExcel(buffer: Buffer, fileName: string): ParseResult {
  try {
    const sheetData = readExcelFirstSheet(buffer);

    if (!sheetData) {
      return {
        success: false,
        rows: [],
        errors: ['El archivo Excel está vacío o no tiene datos']
      };
    }

    const missingColumns = validateRequiredColumns(
      sheetData.headers,
      REQUIRED_COLUMNS
    );

    if (missingColumns.length > 0) {
      return {
        success: false,
        rows: [],
        errors: [`Faltan columnas requeridas: ${missingColumns.join(', ')}`]
      };
    }

    const dates = sheetData.data
      .map((row) => parseExcelDate(row['ANALYSIS_DATE']))
      .filter((d): d is Date => d !== null);

    const fecha_desde =
      dates.length > 0
        ? new Date(Math.min(...dates.map((d) => d.getTime())))
        : null;
    const fecha_hasta =
      dates.length > 0
        ? new Date(Math.max(...dates.map((d) => d.getTime())))
        : null;

    const rows: ParsedRow[] = [];

    for (const raw of sheetData.data) {
      const muestra = String(raw['FIELD_SAMPLE_ID'] ?? '').trim();
      if (!muestra) {
        continue;
      }

      const row: ParsedRow = {
        id_sitio: String(raw['SITE_ID'] ?? '').trim(),
        id_sustancia: String(raw['PARAMETER_CODE'] ?? '').trim(),
        sustancia: String(raw['PARAMETER_NAME'] ?? '').trim(),
        proveedor: String(raw['LAB_ID'] ?? '').trim(),
        muestra,
        metodo: String(raw['ANALYTICAL_METHOD'] ?? '').trim(),
        fecha_laboratorio: parseExcelDate(raw['ANALYSIS_DATE']),
        concentracion: parseNumber(raw['LAB_RESULT']),
        unidad: String(raw['LAB_UNITS'] ?? '').trim(),
        limite_deteccion: String(raw['LAB_DETECTION_LIMIT'] ?? '').trim(),
        tipo: String(raw['LAB_MATRIX'] ?? '').trim(),
        protocolo: String(raw['LAB_SAMPLE_ID'] ?? '').trim(),
        documento_origen: fileName,
        informe_final: fileName,
        metodologia_muestreo: '===metodologia muestreo===',
        fecha_desde,
        fecha_hasta
      };

      rows.push(row);
    }

    if (rows.length === 0) {
      return {
        success: false,
        rows: [],
        errors: [
          'No se encontraron filas válidas (todas las muestras están vacías)'
        ]
      };
    }

    return { success: true, rows, errors: [] };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error desconocido';
    return {
      success: false,
      rows: [],
      errors: [`Error al procesar el Excel: ${message}`]
    };
  }
}
