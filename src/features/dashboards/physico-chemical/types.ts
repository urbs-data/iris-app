import { WellType } from '../substance/types';

export { WellType };

export const FQ_DEFAULTS = {
  dateFrom: '2019-01-01',
  wellType: WellType.MONITORING
} as const;

export interface FQParameter {
  value: string;
  label: string;
}

export interface FQGeneralMetrics {
  lastValue: number;
  average: number;
  min: number;
  max: number;
  unit: string;
  sampleCount: number;
}

export interface FQDailyMetric {
  date: Date;
  value: number;
  unit: string;
}

export interface FQDailyMetricsResult {
  data: FQDailyMetric[];
  unit: string;
}

export interface FQQuarterlyStats {
  period: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  unit: string;
}

export interface FQQuarterlyMetricsResult {
  data: FQQuarterlyStats[];
  unit: string | null;
}

export interface FQWellMetrics {
  wellId: string;
  lat: number;
  lng: number;
  unit: string;
  sampleCount: number;
  mean: number;
  min: number;
  max: number;
}

export interface FQWellMetricsResult {
  data: FQWellMetrics[];
}
