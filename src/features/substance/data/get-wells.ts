import type { Well } from '../types';

// Hardcoded wells - will be replaced with DB fetch using react-query
const WELLS: Well[] = [
  { value: 'well-001', label: 'Pozo PM-01', area: 'area-ab' },
  { value: 'well-002', label: 'Pozo PM-02', area: 'area-ab' },
  { value: 'well-003', label: 'Pozo PM-03', area: 'area-ab' },
  { value: 'well-004', label: 'Pozo PM-04', area: 'area-ab' },
  { value: 'well-005', label: 'Pozo PM-05', area: 'area-c' },
  { value: 'well-006', label: 'Pozo PM-06', area: 'area-c' },
  { value: 'well-007', label: 'Pozo PM-07', area: 'area-c' },
  { value: 'well-008', label: 'Pozo PB-01', area: 'rest' },
  { value: 'well-009', label: 'Pozo PB-02', area: 'rest' },
  { value: 'well-010', label: 'Pozo PB-03', area: 'rest' }
];

export async function getWells(area?: string): Promise<Well[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!area || area === 'all') {
    return WELLS;
  }

  return WELLS.filter((well) => well.area === area);
}

export function getWellsSync(area?: string): Well[] {
  if (!area || area === 'all') {
    return WELLS;
  }

  return WELLS.filter((well) => well.area === area);
}
