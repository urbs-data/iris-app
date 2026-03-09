export interface CorrelationRow extends Record<string, unknown> {
  pozo: string;
  sampleDate: Date;
  substanceValue: number;
  substanceUnit: string;
  parameterDate: Date;
  parameterName: string;
  parameterValue: number;
  parameterUnit: string;
}

export interface CorrelationParameter {
  name: string;
  unit: string;
  correlation: number;
  pvalue: number;
  samples: number;
  data: CorrelationRow[];
}

export type ParameterName = 'ORP' | 'OD' | 'pH' | 'CE' | 'STD' | 'Temp';
export type SpearmanMatrix = Partial<
  Record<ParameterName, Partial<Record<ParameterName, number>>>
>;

export interface LOEAnalysis {
  status: string;
  text: string;
}

export interface CorrelationResult {
  substance: string;
  data: CorrelationParameter[];
  matrix: SpearmanMatrix;
  loeAnalyses: LOEAnalysis[];
}
