import {
  parseString,
  parseNumericWithUnit,
  parseExcelDate,
  validateRequiredColumns,
  readExcelFirstSheet
} from '../parsing/utils';

const REQUIRED_COLUMNS = ['LOCATION_ID', 'LOCATION_TYPE'] as const;

export interface ParsedWellRow {
  id_pozo: string;
  tipo: string;
  elevacion_terreno: number | null;
  coordenada_norte: number | null;
  coordenada_este: number | null;
  latitud_decimal: number | null;
  longitud_decimal: number | null;
  fecha_relevamiento: Date | null;
  responsable_relevamiento: string | null;
  empresa_relevamiento: string | null;
  comentarios: string | null;
  descripcion: string | null;
}

export interface WellsParseResult {
  success: boolean;
  rows: ParsedWellRow[];
  errors: string[];
}

export function parseWellsExcel(buffer: Buffer): WellsParseResult {
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

    const rows: ParsedWellRow[] = [];

    for (const raw of sheetData.data) {
      const tipo = parseString(raw['LOCATION_TYPE']);

      if (!tipo) {
        continue;
      }

      const id_pozo = parseString(raw['LOCATION_ID']);
      if (!id_pozo) {
        continue;
      }

      const row: ParsedWellRow = {
        id_pozo,
        tipo,
        elevacion_terreno: parseNumericWithUnit(raw['GROUND_ELEVATION']),
        coordenada_norte: parseNumericWithUnit(raw['NORTHING']),
        coordenada_este: parseNumericWithUnit(raw['EASTING']),
        latitud_decimal: parseNumericWithUnit(raw['LATITUDE_DECIMAL']),
        longitud_decimal: parseNumericWithUnit(raw['LONGITUDE_DECIMAL']),
        fecha_relevamiento: parseExcelDate(raw['SURVEY_DATE']),
        responsable_relevamiento: parseString(raw['SURVEYED_BY']),
        empresa_relevamiento: parseString(raw['SURVEYING_COMPANY']),
        comentarios: parseString(raw['LOCATION_COMMENTS']),
        descripcion: parseString(raw['LOCATION_DESC'])
      };

      rows.push(row);
    }

    if (rows.length === 0) {
      return {
        success: false,
        rows: [],
        errors: ['No se encontraron filas válidas (todas sin tipo de pozo)']
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
