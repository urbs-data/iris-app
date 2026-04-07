'use server';

import { eq } from 'drizzle-orm';
import { getLocale } from 'next-intl/server';
import { substancesTable, concentracionesTable } from '@/db/schema';
import type { Substance } from '../types';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';

export const getSubstances = authOrganizationActionClient
  .metadata({ actionName: 'getSubstances' })
  .action(async ({ ctx }): Promise<Substance[]> => {
    const [results, locale] = await Promise.all([
      ctx.db
        .selectDistinct({
          id_sustancia: substancesTable.id_sustancia,
          nombre_ingles: substancesTable.nombre_ingles,
          nombre_espanol: substancesTable.nombre_espanol,
          categoria: substancesTable.categoria,
          nivel_guia: substancesTable.nivel_guia,
          unidad_guia: substancesTable.unidad_guia,
          nivel_guia_suelo: substancesTable.nivel_guia_suelo,
          unidad_guia_suelo: substancesTable.unidad_guia_suelo
        })
        .from(substancesTable)
        .innerJoin(
          concentracionesTable,
          eq(concentracionesTable.id_sustancia, substancesTable.id_sustancia)
        ),
      getLocale()
    ]);

    return results.map(
      (row): Substance => ({
        ...row,
        value: row.id_sustancia,
        label:
          locale === 'es'
            ? (row.nombre_espanol ?? row.nombre_ingles)
            : (row.nombre_ingles ?? row.nombre_espanol ?? row.id_sustancia)
      })
    );
  });
