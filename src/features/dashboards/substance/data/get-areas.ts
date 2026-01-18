'use server';

import { and, inArray, isNotNull } from 'drizzle-orm';
import { pozosTable } from '@/db/schema';
import type { Area } from '../types';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';

export const getAreas = authOrganizationActionClient
  .metadata({ actionName: 'getAreas' })
  .action(async ({ ctx }): Promise<Area[]> => {
    const results = await ctx.db
      .selectDistinct({
        area: pozosTable.area
      })
      .from(pozosTable)
      .where(
        and(
          inArray(pozosTable.tipo, ['WELL', 'PUMP']),
          isNotNull(pozosTable.area)
        )
      )
      .orderBy(pozosTable.area);

    const areas: Area[] = [{ value: 'all', label: 'Todos' }];

    results.forEach((row) => {
      if (row.area) {
        areas.push({
          value: row.area,
          label: row.area
        });
      }
    });

    return areas;
  });
