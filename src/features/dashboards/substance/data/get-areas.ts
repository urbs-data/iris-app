'use server';

import { and, inArray, isNotNull } from 'drizzle-orm';
import { getLocale, getTranslations } from 'next-intl/server';
import { pozosTable } from '@/db/schema';
import type { Area } from '../types';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';

export const getAreas = authOrganizationActionClient
  .metadata({ actionName: 'getAreas' })
  .action(async ({ ctx }): Promise<Area[]> => {
    const [results, tAreas, locale] = await Promise.all([
      ctx.db
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
        .orderBy(pozosTable.area),
      getTranslations('areas'),
      getLocale()
    ]);

    const areas: Area[] = [
      { value: 'all', label: locale === 'es' ? 'Todos' : 'All' }
    ];

    results.forEach((row) => {
      if (row.area) {
        const key = row.area as Parameters<typeof tAreas>[0];
        areas.push({
          value: row.area,
          label: tAreas.has(key) ? tAreas(key) : row.area
        });
      }
    });

    return areas;
  });
