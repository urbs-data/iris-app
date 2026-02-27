export const REPORT_TYPES = [
  'well_depth',
  'sampling_params',
  'sampling_params_cig',
  'volatile_concentrations_cig',
  'inorganic_concentrations_cig',
  'concentrations',
  'analysis_performed'
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const PRESET_OPTIONS = [
  {
    value: 'formulario_6_provincia_ba',
    label: 'Formulario 6 Provincia BA'
  },
  {
    value: 'datos_formulario_6_provincia_ba_cig',
    label: 'Reportes para CIG'
  }
] as const;

export type PresetValue = (typeof PRESET_OPTIONS)[number]['value'];

export const PRESET_REPORT_MAP: Record<PresetValue, ReportType[]> = {
  formulario_6_provincia_ba: [
    'well_depth',
    'sampling_params',
    'concentrations',
    'analysis_performed'
  ],
  datos_formulario_6_provincia_ba_cig: [
    'sampling_params_cig',
    'volatile_concentrations_cig',
    'inorganic_concentrations_cig'
  ]
};

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
