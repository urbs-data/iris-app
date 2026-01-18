export const DocumentType = {
  EDD: 'EDD',
  PRELIMINAR: 'PRELIMINAR',
  MATRIX_SPIKE: 'MATRIX_SPIKE',
  MATRIX_SPIKE_ORIGINAL: 'MATRIX_SPIKE_ORIGINAL',
  PARAMETROS: 'PARAMETROS_FQ'
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const ValidationStatus = {
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  SKIPPED: 'SKIPPED'
} as const;

export type ValidationStatus =
  (typeof ValidationStatus)[keyof typeof ValidationStatus];

export const ValidationCode = {
  REQUIRED_COLUMNS: 'VAL-01',
  RANGE_VALUES: 'VAL-02',
  GUIDELINE_LEVEL: 'VAL-03',
  SAMPLE_ID: 'VAL-04',
  EXISTING_WELLS: 'VAL-05',
  HOLDING_TIME: 'VAL-06',
  EQUALITY: 'VAL-07',
  DUPLICIDAD_PRELIMINAR: 'VAL-08',
  MATRIX_SPIKE: 'VAL-09',
  MATRIX_SPIKE_DUPLICATES: 'VAL-10',
  MISSING: 'VAL-11'
} as const;

export type ValidationCode =
  (typeof ValidationCode)[keyof typeof ValidationCode];

export interface ValidationResult {
  codigo: ValidationCode;
  archivos: DocumentType[];
  estado: ValidationStatus;
  descripcion: string;
  formateo: Record<string, string>;
  datos: Record<string, unknown>[];
}

export const TRIP_BLANK_SAMPLE_REGEX = /^(TB|EB)-\d{6}(-\d{1})?$/;
export const GENERIC_SAMPLE_REGEX =
  /^(?:E\d{2})?(?:GW|SS)\d{4}-[a-zA-Z0-9]+(?:-D|-\d{2}|-\d?,\d?|-MS|-MSD)?$/;

export interface ValidationResultData {
  codigo: string;
  descripcion: string;
  formateo: Record<string, string>;
  archivos: Record<string, string>;
  estado: 'SUCCESS' | 'WARNING' | 'ERROR' | 'SKIPPED';
  datos: Record<string, unknown>[];
}
