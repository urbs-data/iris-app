'use server';

import { eq, and, inArray } from 'drizzle-orm';
import { pozosTable } from '@/db/schema';
import type { Well } from '../types';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getWellsSchema } from './get-wells-schema';

export const getWells = authOrganizationActionClient
  .metadata({ actionName: 'getWells' })
  .inputSchema(getWellsSchema)
  .action(async ({ ctx, parsedInput }): Promise<Well[]> => {
    const { area } = parsedInput;

    const conditions = [inArray(pozosTable.tipo, ['WELL', 'PUMP'])];

    if (area && area !== 'all') {
      conditions.push(eq(pozosTable.area, area));
    }

    const results = await ctx.db
      .select({
        id_pozo: pozosTable.id_pozo,
        latitud_decimal: pozosTable.latitud_decimal,
        longitud_decimal: pozosTable.longitud_decimal,
        area: pozosTable.area,
        tipo_pozo: pozosTable.tipo
      })
      .from(pozosTable)
      .where(and(...conditions))
      .orderBy(pozosTable.id_pozo);

    return results.map(
      (row): Well => ({
        value: row.id_pozo,
        label: row.id_pozo,
        area: row.area,
        latitud_decimal: row.latitud_decimal,
        longitud_decimal: row.longitud_decimal,
        tipo_pozo: row.tipo_pozo
      })
    );
  });
