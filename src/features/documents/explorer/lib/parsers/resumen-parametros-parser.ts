import { isValid, parse, set } from 'date-fns';
import {
  buildNormalizedHeaderMap,
  normalizeHeaderName,
  parseExcelDate,
  parseString,
  readExcelFirstSheet,
  validateRequiredNormalizedColumns
} from '../parsing/utils';

const REQUIRED_COLUMNS = [
  'ID Pozo',
  'Fecha muestreo',
  'Hora',
  'Olor',
  'Apariencia del agua al incio de las lecturas',
  'Apariencia del agua al finalizar la estabilizacion'
] as const;

const REQUIRED_COLUMN_ALIASES: Record<string, readonly string[]> = {
  'Apariencia del agua al incio de las lecturas': [
    'Apariencia del agua al inicio de las lecturas'
  ]
};

interface CanonicalColumns {
  idPozo: string;
  fechaMuestreo: string;
  hora: string;
  olor: string;
  aparienciaAguaInicio: string;
  aparienciaAguaEstabilizacion: string;
}

export interface ParsedResumenParametroRow {
  id_pozo: string;
  fecha_hora_medicion: Date | null;
  olor: string | null;
  apariencia_agua_inicio: string | null;
  apariencia_agua_estabilizacion: string | null;
}

export interface ResumenParametrosParseResult {
  success: boolean;
  rows: ParsedResumenParametroRow[];
  errors: string[];
}

function normalizeAmbiguousCentury(date: Date): Date {
  const year = date.getFullYear();
  if (year >= 0 && year < 100) {
    return set(date, { year: year + 2000 });
  }
  return date;
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return parseExcelDate(value);
  }

  if (value instanceof Date) {
    return normalizeAmbiguousCentury(value);
  }

  const str = String(value).trim();
  const formats = [
    'd/M/yy',
    'M/d/yy',
    'dd/MM/yy',
    'MM/dd/yy',
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'yyyy-MM-dd'
  ];

  for (const format of formats) {
    const parsed = parse(str, format, new Date());
    if (isValid(parsed)) {
      return normalizeAmbiguousCentury(parsed);
    }
  }

  const fallback = parseExcelDate(value);
  return fallback ? normalizeAmbiguousCentury(fallback) : null;
}

function parseTime(
  value: unknown
): { hours: number; minutes: number; seconds: number } | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    const totalSeconds = Math.round(value * 24 * 60 * 60);
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }

  if (value instanceof Date) {
    return {
      hours: value.getHours(),
      minutes: value.getMinutes(),
      seconds: value.getSeconds()
    };
  }

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

function getCanonicalColumn(
  headerMap: Record<string, string>,
  requiredHeader: string
): string | null {
  const normalizedRequired = normalizeHeaderName(requiredHeader);
  const aliasHeaders = REQUIRED_COLUMN_ALIASES[requiredHeader] ?? [];
  const normalizedAliases = aliasHeaders.map(normalizeHeaderName);
  const candidates = [normalizedRequired, ...normalizedAliases];

  for (const candidate of candidates) {
    if (headerMap[candidate]) {
      return headerMap[candidate];
    }
  }

  return null;
}

function resolveColumns(headers: string[]): CanonicalColumns | null {
  const headerMap = buildNormalizedHeaderMap(headers);

  const idPozo = getCanonicalColumn(headerMap, 'ID Pozo');
  const fechaMuestreo = getCanonicalColumn(headerMap, 'Fecha muestreo');
  const hora = getCanonicalColumn(headerMap, 'Hora');
  const olor = getCanonicalColumn(headerMap, 'Olor');
  const aparienciaAguaInicio = getCanonicalColumn(
    headerMap,
    'Apariencia del agua al incio de las lecturas'
  );
  const aparienciaAguaEstabilizacion = getCanonicalColumn(
    headerMap,
    'Apariencia del agua al finalizar la estabilizacion'
  );

  if (
    !idPozo ||
    !fechaMuestreo ||
    !hora ||
    !olor ||
    !aparienciaAguaInicio ||
    !aparienciaAguaEstabilizacion
  ) {
    return null;
  }

  return {
    idPozo,
    fechaMuestreo,
    hora,
    olor,
    aparienciaAguaInicio,
    aparienciaAguaEstabilizacion
  };
}

export function parseResumenParametrosExcel(
  buffer: Buffer
): ResumenParametrosParseResult {
  try {
    const sheetData = readExcelFirstSheet(buffer);

    if (!sheetData) {
      return {
        success: false,
        rows: [],
        errors: ['El archivo Excel está vacío o no tiene datos']
      };
    }

    const missingColumns = validateRequiredNormalizedColumns(
      sheetData.headers,
      REQUIRED_COLUMNS,
      REQUIRED_COLUMN_ALIASES
    );

    if (missingColumns.length > 0) {
      return {
        success: false,
        rows: [],
        errors: [`Faltan columnas requeridas: ${missingColumns.join(', ')}`]
      };
    }

    const columns = resolveColumns(sheetData.headers);
    if (!columns) {
      return {
        success: false,
        rows: [],
        errors: ['No se pudieron resolver las columnas requeridas']
      };
    }

    const rows: ParsedResumenParametroRow[] = [];

    for (const raw of sheetData.data) {
      const idPozo = parseString(raw[columns.idPozo]);
      if (!idPozo) {
        continue;
      }

      const fecha = parseDate(raw[columns.fechaMuestreo]);
      const fechaHora = combineDateTime(fecha, raw[columns.hora]);

      rows.push({
        id_pozo: idPozo,
        fecha_hora_medicion: fechaHora,
        olor: parseString(raw[columns.olor]),
        apariencia_agua_inicio: parseString(raw[columns.aparienciaAguaInicio]),
        apariencia_agua_estabilizacion: parseString(
          raw[columns.aparienciaAguaEstabilizacion]
        )
      });
    }

    if (rows.length === 0) {
      return {
        success: false,
        rows: [],
        errors: ['No se encontraron filas válidas (todas sin ID Pozo)']
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
