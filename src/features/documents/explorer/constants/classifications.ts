export const Classification = {
  Muestras: 'Muestras',
  ProcesosRemediacion: 'Procesos de remediacion',
  ReportesMonitoreo: 'Reportes de monitoreo',
  MemorandumTecnicos: 'Memorandum tecnicos',
  ReportesTecnicos: 'Reportes tecnicos',
  ReportesAutoridades: 'Reportes a las autoridades',
  EstudiosComplementarios: 'Estudios complementarios',
  EstudiosHidrogeologicos: 'Estudios hidrogeologicos',
  InformesAvance: 'Informes de avance',
  Pozos: 'Pozos',
  Sustancias: 'Sustancias',
  Otros: 'Otros'
} as const;

export const SubClassification = {
  CadenasCustodia: 'Cadenas de custodia',
  MuestrasSuelo: 'Muestras de suelo',
  MuestrasAgua: 'Muestras de agua',
  CoCAgua: 'CoC de agua',
  CoCSuelo: 'CoC de suelo',
  ReportesDiarios: 'Reportes diarios',
  Inyeccion: 'Inyección',
  Otros: 'Otros'
} as const;

export const Area = {
  AreaA: 'Area A',
  AreaB: 'Area B',
  AreaC: 'Area C'
} as const;

export const CLASSIFICATIONS_MAP: Record<string, string[]> = {
  [Classification.Muestras]: [
    SubClassification.CadenasCustodia,
    SubClassification.MuestrasSuelo,
    SubClassification.MuestrasAgua,
    SubClassification.CoCAgua,
    SubClassification.CoCSuelo
  ],
  [Classification.ProcesosRemediacion]: [
    SubClassification.ReportesDiarios,
    SubClassification.Inyeccion,
    SubClassification.Otros
  ],
  [Classification.ReportesMonitoreo]: [SubClassification.Otros],
  [Classification.MemorandumTecnicos]: [SubClassification.Otros],
  [Classification.ReportesTecnicos]: [SubClassification.Otros],
  [Classification.ReportesAutoridades]: [SubClassification.Otros],
  [Classification.EstudiosComplementarios]: [SubClassification.Otros],
  [Classification.EstudiosHidrogeologicos]: [SubClassification.Otros],
  [Classification.InformesAvance]: [SubClassification.Otros],
  [Classification.Pozos]: [SubClassification.Otros],
  [Classification.Sustancias]: [SubClassification.Otros],
  [Classification.Otros]: [SubClassification.Otros]
};

export const AREAS = Object.values(Area);

export type ClassificationType =
  (typeof Classification)[keyof typeof Classification];
export type SubClassificationType =
  (typeof SubClassification)[keyof typeof SubClassification];
export type AreaType = (typeof Area)[keyof typeof Area];
