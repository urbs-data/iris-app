import * as XLSX from 'xlsx';

export interface SheetData {
  name: string;
  sheet: XLSX.WorkSheet;
  data: Array<Record<string, unknown>>;
  headers: string[];
}

export function parseString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const str = String(value).trim();
  return str === '' || str.toLowerCase() === 'nan' ? null : str;
}

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const num = Number(value);
  return isNaN(num) ? null : num;
}

export function parseExcelDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return XLSX.SSF.parse_date_code(value) as unknown as Date;
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function parseNumericWithUnit(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  const cleaned = String(value)
    .replace(/m\s*IGN/gi, '')
    .replace(/m/gi, '')
    .replace(',', '.')
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function validateRequiredColumns(
  headers: string[],
  requiredColumns: readonly string[]
): string[] {
  const missingColumns: string[] = [];

  for (const required of requiredColumns) {
    if (!headers.includes(required)) {
      missingColumns.push(required);
    }
  }

  return missingColumns;
}

export function normalizeHeaderName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function buildNormalizedHeaderMap(
  headers: string[]
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const header of headers) {
    const normalized = normalizeHeaderName(header);
    if (normalized && !map[normalized]) {
      map[normalized] = header;
    }
  }

  return map;
}

export function validateRequiredNormalizedColumns(
  headers: string[],
  requiredColumns: readonly string[],
  aliases: Record<string, readonly string[]> = {}
): string[] {
  const normalizedHeaderMap = buildNormalizedHeaderMap(headers);
  const missingColumns: string[] = [];

  for (const required of requiredColumns) {
    const normalizedRequired = normalizeHeaderName(required);
    const normalizedAliases = (aliases[required] ?? []).map(
      normalizeHeaderName
    );
    const candidates = [normalizedRequired, ...normalizedAliases];

    const hasAnyCandidate = candidates.some((candidate) =>
      Boolean(normalizedHeaderMap[candidate])
    );

    if (!hasAnyCandidate) {
      missingColumns.push(required);
    }
  }

  return missingColumns;
}

export function readExcelFirstSheet(buffer: Buffer): SheetData | null {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return null;
    }

    const sheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });

    if (data.length === 0) {
      return null;
    }

    const headers = Object.keys(data[0]);

    return {
      name: sheetName,
      sheet,
      data,
      headers
    };
  } catch {
    return null;
  }
}

export function isExcelFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop();
  return ext === 'xlsx' || ext === 'xls';
}
