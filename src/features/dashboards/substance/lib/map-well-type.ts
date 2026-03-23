import { WellType } from '../types';

const WELL_TYPE_MAP: Record<string, string> = {
  [WellType.MONITORING]: 'Pozo monitoreo',
  [WellType.PUMP]: 'Pozo bombeo'
};

export function mapWellType(wellType: string): string {
  return WELL_TYPE_MAP[wellType] ?? wellType;
}
