'use server';

import { getTranslations } from 'next-intl/server';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { z } from 'zod';
import type { FQParameter } from '../types';
import { parametrosFisicoQuimicosTable } from '@/db/schema';

export const getFqParameters = authOrganizationActionClient
  .metadata({ actionName: 'getFqParameters' })
  .inputSchema(z.object({}))
  .action(async ({ ctx }): Promise<FQParameter[]> => {
    const [results, tFq] = await Promise.all([
      ctx.db
        .selectDistinct({
          parametro: parametrosFisicoQuimicosTable.parametro
        })
        .from(parametrosFisicoQuimicosTable),
      getTranslations('fqParameters')
    ]);

    return results.map((row): FQParameter => {
      const value = row.parametro ?? '';
      const key = value as Parameters<typeof tFq>[0];
      return {
        value,
        label: tFq.has(key) ? tFq(key) : value
      };
    });
  });
