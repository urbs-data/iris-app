'use server';

import { eq, sql } from 'drizzle-orm';
import { substancesTable, concentracionesTable } from '@/db/schema';
import type { Substance } from '../types';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';

export const getSubstances = authOrganizationActionClient
  .metadata({ actionName: 'getSubstances' })
  .action(async ({ ctx }): Promise<Substance[]> => {
    const results = await ctx.db
      .selectDistinct({
        id_sustancia: substancesTable.id_sustancia,
        nombre_ingles: substancesTable.nombre_ingles,
        nombre_espanol: substancesTable.nombre_espanol,
        categoria: substancesTable.categoria,
        nivel_guia: substancesTable.nivel_guia,
        unidad_guia: substancesTable.unidad_guia,
        nivel_guia_suelo: substancesTable.nivel_guia_suelo,
        unidad_guia_suelo: substancesTable.unidad_guia_suelo,
        label: sql<string>`COALESCE(${substancesTable.nombre_espanol}, ${substancesTable.nombre_ingles})`
      })
      .from(substancesTable)
      .innerJoin(
        concentracionesTable,
        eq(concentracionesTable.id_sustancia, substancesTable.id_sustancia)
      );

    return results.map(
      (row): Substance => ({
        ...row,
        value: row.id_sustancia
      })
    );
  });
