import type { LucideIcon } from 'lucide-react';
import { Layers, FlaskConical, Droplets, ClipboardCheck } from 'lucide-react';
import type { ReportType } from './types';

export interface FilterFieldConfig {
  key: string;
  type: 'wells';
}

export interface ReportTypeConfig {
  icon: LucideIcon;
  titlePrefix: string;
  filters: FilterFieldConfig[];
}

export const REPORT_TYPE_CONFIG: Record<ReportType, ReportTypeConfig> = {
  well_depth: {
    icon: Layers,
    titlePrefix: 'ProfundidadPozos',
    filters: [{ key: 'pozos', type: 'wells' }]
  },
  sampling_params: {
    icon: FlaskConical,
    titlePrefix: 'ParametrosMuestreo',
    filters: [{ key: 'pozos', type: 'wells' }]
  },
  sampling_params_cig: {
    icon: FlaskConical,
    titlePrefix: 'ParametrosMuestreoCIG',
    filters: []
  },
  volatile_concentrations_cig: {
    icon: Droplets,
    titlePrefix: 'ConcentracionesVolatilesCIG',
    filters: []
  },
  inorganic_concentrations_cig: {
    icon: Droplets,
    titlePrefix: 'ConcentracionesInorgánicasCIG',
    filters: []
  },
  concentrations: {
    icon: Droplets,
    titlePrefix: 'Concentraciones',
    filters: [{ key: 'pozos', type: 'wells' }]
  },
  analysis_performed: {
    icon: ClipboardCheck,
    titlePrefix: 'AvanceTareasRemediación',
    filters: [{ key: 'pozos', type: 'wells' }]
  }
};
