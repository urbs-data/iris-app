import type { DateRange } from 'react-day-picker';

export interface Substance {
  value: string;
  label: string;
}

export interface Well {
  value: string;
  label: string;
  area: string;
}

export interface Area {
  value: string;
  label: string;
}

export type WellType = 'all' | 'monitoring' | 'pump';
export type SampleType = 'water' | 'soil';

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
}

export interface MonthlyConcentration {
  date: string;
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
  wellId: string;
  wellName: string;
  lat: number;
  lng: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
}
