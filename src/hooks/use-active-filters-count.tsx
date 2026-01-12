'use client';

import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';

type SearchParams = Record<string, any>;

/**
 * Hook para contar filtros activos automáticamente.
 * Excluye automáticamente los campos de paginación y ordenamiento.
 *
 * @param searchParams - Objeto con los parsers de los searchParams
 * @returns Número de filtros activos
 */
export function useActiveFiltersCount(searchParams: SearchParams): number {
  // Campos que no son filtros y deben ser excluidos del conteo
  const excludedKeys = new Set([
    'page',
    'perPage',
    'sortBy',
    'sortDirection',
    'search',
    'preset'
  ]);

  // Crear un objeto solo con los filtros (excluyendo paginación y ordenamiento)
  const filterParsers = useMemo(() => {
    return Object.entries(searchParams).reduce<SearchParams>(
      (acc, [key, parser]) => {
        if (!excludedKeys.has(key)) {
          acc[key] = parser?.withOptions({ shallow: true }) || parser;
        }
        return acc;
      },
      {}
    );
  }, [searchParams]);

  // Leer todos los filtros de una vez
  const [filterValues] = useQueryStates(filterParsers);

  // Contar cuántos filtros tienen valores
  return useMemo(() => {
    return Object.values(filterValues).filter(
      (value) => value != null && value !== ''
    ).length;
  }, [filterValues]);
}
