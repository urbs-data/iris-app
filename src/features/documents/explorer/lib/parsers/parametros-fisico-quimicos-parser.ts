import {
  parseString,
  parseNumericWithUnit,
  parseExcelDate,
  validateRequiredColumns,
  readExcelFirstSheet
} from '../parsing/utils';
import { parse, isValid, set } from 'date-fns';

const REQUIRED_COLUMNS = ['LOCATION_ID', 'FIELD_PARAMETER'] as const;

export interface ParsedParametroFisicoQuimicoRow {
  id_pozo: string | null;
  programa_muestreo: string | null;
  field_sample_id: string | null;
  profundidad_inicio: number | null;
  profundidad_fin: number | null;
  unidad_profundidad: string | null;
  parametro: string;
  valor_medicion: number | null;
  unidad_medicion: string | null;
  fecha_hora_medicion: Date | null;
  comentarios: string | null;
}

export interface ParametrosFisicoQuimicosParseResult {
  success: boolean;
  rows: ParsedParametroFisicoQuimicoRow[];
  errors: string[];
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Si es un número (Excel serial date)
  if (typeof value === 'number') {
    return parseExcelDate(value);
  }

  // Si ya es una Date
  if (value instanceof Date) {
    return value;
  }

  const str = String(value).trim();

  // Intentar varios formatos comunes
  const formats = ['dd/MM/yyyy', 'dd/MM/yy', 'MM/dd/yyyy', 'yyyy-MM-dd'];

  for (const format of formats) {
    const parsed = parse(str, format, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }

  // Fallback a parseExcelDate
  return parseExcelDate(value);
}

function parseTime(
  value: unknown
): { hours: number; minutes: number; seconds: number } | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Si es un número (Excel serial time)
  if (typeof value === 'number') {
    const totalSeconds = Math.round(value * 24 * 60 * 60);
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }

  // Si es una Date, extraer el time
  if (value instanceof Date) {
    return {
      hours: value.getHours(),
      minutes: value.getMinutes(),
      seconds: value.getSeconds()
    };
  }

  // Parsear string de tiempo (HH:mm:ss o HH:mm)
  const timeStr = String(value).trim();
  const timeParts = timeStr.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);

  if (!timeParts) {
    return null;
  }

  return {
    hours: parseInt(timeParts[1], 10),
    minutes: parseInt(timeParts[2], 10),
    seconds: timeParts[3] ? parseInt(timeParts[3], 10) : 0
  };
}

function combineDateTime(date: Date | null, time: unknown): Date | null {
  if (!date) {
    return null;
  }

  const timeComponents = parseTime(time);

  if (!timeComponents) {
    return date;
  }

  return set(date, {
    hours: timeComponents.hours,
    minutes: timeComponents.minutes,
    seconds: timeComponents.seconds,
    milliseconds: 0
  });
}

export function parseParametrosFisicoQuimicosExcel(
  buffer: Buffer
): ParametrosFisicoQuimicosParseResult {
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

    const rows: ParsedParametroFisicoQuimicoRow[] = [];

    for (const raw of sheetData.data) {
      const parametro = parseString(raw['FIELD_PARAMETER']);

      if (!parametro) {
        continue;
      }

      const id_pozo = parseString(raw['LOCATION_ID']);
      if (!id_pozo) {
        continue;
      }

      const fecha = parseDate(raw['FIELD_MEASUREMENT_DATE']);
      const fecha_hora_medicion = combineDateTime(
        fecha,
        raw['FIELD_MEASUREMENT_TIME']
      );

      const row: ParsedParametroFisicoQuimicoRow = {
        id_pozo,
        programa_muestreo: parseString(raw['SAMPLING_PROGRAM']),
        field_sample_id: parseString(raw['FIELD_SAMPLE_ID']),
        profundidad_inicio: parseNumericWithUnit(
          raw['FIELD_MEASUREMENT_START_DEPTH']
        ),
        profundidad_fin: parseNumericWithUnit(
          raw['FIELD_MEASUREMENT_END_DEPTH']
        ),
        unidad_profundidad: parseString(raw['FIELD_MEASUREMENT_DEPTH_UNITS']),
        parametro,
        valor_medicion: parseNumericWithUnit(raw['FIELD_MEASUREMENT_VALUE']),
        unidad_medicion: parseString(raw['FIELD_MEASUREMENT_UNITS']),
        fecha_hora_medicion,
        comentarios: parseString(raw['FIELD_MEASUREMENT_COMMENTS'])
      };

      rows.push(row);
    }

    if (rows.length === 0) {
      return {
        success: false,
        rows: [],
        errors: [
          'No se encontraron filas válidas (todas sin LOCATION_ID o FIELD_PARAMETER)'
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
