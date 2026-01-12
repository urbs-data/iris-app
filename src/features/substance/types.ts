export enum WellType {
  MONITORING = 'WELL',
  PUMP = 'PUMP'
}

export enum SampleType {
  WATER = 'Agua',
  SOIL = 'Suelo'
}

export const SUBSTANCE_DEFAULTS = {
  substance: '56-23-5',
  sampleType: SampleType.WATER,
  dateFrom: '2019-01-01',
  wellType: WellType.MONITORING
} as const;

export interface Substance {
  id_sustancia: string;
  nombre_ingles: string;
  nombre_espanol: string | null;
  categoria: string | null;
  nivel_guia: number | null;
  unidad_guia: string | null;
  nivel_guia_suelo: number | null;
  unidad_guia_suelo: string | null;
  // Computed fields
  value: string; // id_sustancia
  label: string; // coalesce(nombre_espanol, nombre_ingles)
}

export interface Well {
  value: string; // id_pozo
  label: string; // id_pozo
  area: string | null;
  latitud_decimal: number | null;
  longitud_decimal: number | null;
  tipo_pozo: string | null;
}

export interface Area {
  value: string; // area from pozos table
  label: string; // area from pozos table
}

export interface GeneralMetrics {
  samples: number;
  average: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  guideLevel: number;
  vsGuidePercent: number;
  vsMaxPercent: number;
  lastMonthlyAverage?: number;
  maxMonthlyAverage?: number;
}

export interface MonthlyConcentration {
  date: Date;
  value: number;
}

export interface QuarterlyStats {
  period: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
}

export interface WellMetrics {
  wellId: string; // pozo
  lat: number; // latitud_decimal
  lng: number; // longitud_decimal
  unit: string; // unidad
  firstPeriod: string; // primer_periodo
  lastPeriod: string; // ultimo_periodo
  sampleCount: number; // cantidad_registros
  mean: number; // promedio_concentracion
  stdDev: number; // desvio_concentracion
  min: number; // minimo_concentracion
  max: number; // maximo_concentracion
  median: number; // mediana_concentracion
}

export interface MapMetricsResult {
  data: WellMetrics[];
  guideLevel: number;
}
