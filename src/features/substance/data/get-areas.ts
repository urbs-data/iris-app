import type { Area } from '../types';

// Hardcoded areas - will be replaced with DB fetch
const AREAS: Area[] = [
  { value: 'all', label: 'Todos' },
  { value: 'area-ab', label: 'Área A y B' },
  { value: 'area-c', label: 'Área C' },
  { value: 'rest', label: 'Resto' }
];

export async function getAreas(): Promise<Area[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return AREAS;
}

export function getAreasSync(): Area[] {
  return AREAS;
}
