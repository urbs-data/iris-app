export const REPORT_TYPES = [
  'well_depth',
  'sampling_params',
  'concentrations'
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const PRESET_OPTIONS = [
  {
    value: 'formulario_6_provincia_ba',
    label: 'Formulario 6 Provincia BA'
  }
] as const;

export const PRESET_TYPES = ['formulario_6_provincia_ba'] as const;

export type PresetValue = (typeof PRESET_OPTIONS)[number]['value'];

export interface RecentExport {
  id: string;
  name: string;
  generatedAt: string;
  range: string;
  user: string;
  format: 'xlsx' | 'zip' | 'pdf';
  urlReport: string;
}

export interface ExportedReportPayload {
  fileName: string;
  contentType: string;
  base64: string;
}
