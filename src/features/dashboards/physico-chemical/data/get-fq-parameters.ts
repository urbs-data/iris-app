'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { z } from 'zod';
import type { FQParameter } from '../types';
import { parametrosFisicoQuimicosTable } from '@/db/schema';

export const getFqParameters = authOrganizationActionClient
  .metadata({ actionName: 'getFqParameters' })
  .inputSchema(z.object({}))
  .action(async ({ ctx }): Promise<FQParameter[]> => {
    const results = await ctx.db
      .selectDistinct({
        parametro: parametrosFisicoQuimicosTable.parametro
      })
      .from(parametrosFisicoQuimicosTable);

    return results.map(
      (row): FQParameter => ({
        label: row.parametro ?? '',
        value: row.parametro ?? ''
      })
    );
  });
