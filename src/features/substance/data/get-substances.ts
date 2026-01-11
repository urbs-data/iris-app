import type { Substance } from '../types';

// Hardcoded substances - will be replaced with DB fetch
const SUBSTANCES: Substance[] = [
  { value: 'tetrachloroethylene', label: 'Tetracloruro de carbono' },
  { value: 'benzene', label: 'Benceno' },
  { value: 'toluene', label: 'Tolueno' },
  { value: 'xylene', label: 'Xileno' },
  { value: 'ethylbenzene', label: 'Etilbenceno' },
  { value: 'chloroform', label: 'Cloroformo' },
  { value: 'dichloromethane', label: 'Diclorometano' },
  { value: 'trichloroethylene', label: 'Tricloroetileno' },
  { value: 'vinyl-chloride', label: 'Cloruro de vinilo' },
  { value: 'arsenic', label: 'Arsénico' },
  { value: 'lead', label: 'Plomo' },
  { value: 'mercury', label: 'Mercurio' },
  { value: 'cadmium', label: 'Cadmio' },
  { value: 'chromium', label: 'Cromo' },
  { value: 'nickel', label: 'Níquel' }
];

export async function getSubstances(): Promise<Substance[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return SUBSTANCES;
}

export function getSubstancesSync(): Substance[] {
  return SUBSTANCES;
}
