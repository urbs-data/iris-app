import {
  parseString,
  parseNumber,
  validateRequiredColumns,
  readExcelFirstSheet
} from '../parsing/utils';

const REQUIRED_COLUMNS = ['Parameter Code', 'Name'] as const;

export interface ParsedSubstanceRow {
  id_sustancia: string;
  nombre_ingles: string;
  nombre_espanol: string | null;
  alias: string | null;
  categoria: string | null;
  nivel_guia: number | null;
  unidad_guia: string | null;
  nivel_guia_suelo: number | null;
  unidad_guia_suelo: string | null;
}

export interface SubstancesParseResult {
  success: boolean;
  rows: ParsedSubstanceRow[];
  errors: string[];
}

export function parseSubstancesExcel(buffer: Buffer): SubstancesParseResult {
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

    const rows: ParsedSubstanceRow[] = [];

    for (const raw of sheetData.data) {
      const id_sustancia = parseString(raw['Parameter Code']);
      const nombre_ingles = parseString(raw['Name']);

      if (!id_sustancia || !nombre_ingles) {
        continue;
      }

      const row: ParsedSubstanceRow = {
        id_sustancia,
        nombre_ingles,
        nombre_espanol: parseString(raw['Name español']),
        alias: parseString(raw['Alias']),
        categoria: parseString(raw['Parameter Category']),
        nivel_guia: parseNumber(raw['Guideline Level']),
        unidad_guia: parseString(raw['Guideline unit']),
        nivel_guia_suelo: parseNumber(raw['Guideline Level Soil']),
        unidad_guia_suelo: parseString(raw['Guideline unit Soil'])
      };

      rows.push(row);
    }

    if (rows.length === 0) {
      return {
        success: false,
        rows: [],
        errors: ['No se encontraron filas válidas']
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
