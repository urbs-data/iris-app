'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getRecentExportsSchema } from './get-recent-exports-schema';
import { reportsTable } from '@/db/schema';
import { desc, count } from 'drizzle-orm';
import { format, formatRelative } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { getLocale } from 'next-intl/server';
import type { RecentExport } from '../lib/types';

export interface RecentExportsPaginated {
  data: RecentExport[];
  totalCount: number;
}

export const getRecentExports = authOrganizationActionClient
  .metadata({ actionName: 'getRecentExports' })
  .inputSchema(getRecentExportsSchema)
  .action(async ({ parsedInput, ctx }): Promise<RecentExportsPaginated> => {
    const page = parsedInput.page || 1;
    const limit = parsedInput.limit || 10;
    const offset = (page - 1) * limit;

    const { rows, totalCount } = await ctx.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(reportsTable)
        .orderBy(desc(reportsTable.created_at))
        .limit(limit)
        .offset(offset);

      const totalResult = await tx
        .select({ count: count() })
        .from(reportsTable);

      return { rows, totalCount: Number(totalResult[0]?.count ?? 0) };
    });

    const locale = await getLocale();
    const dateFnsLocale = locale === 'es' ? es : enUS;
    const now = new Date();
    const data: RecentExport[] = rows.map((row) => ({
      id: row.id_reporte,
      name: row.nombre_archivo,
      generatedAt: formatRelative(row.created_at, now, {
        locale: dateFnsLocale
      }),
      range: `${format(row.fecha_desde, 'yyyy-MM-dd')} - ${format(row.fecha_hasta, 'yyyy-MM-dd')}`,
      user: row.nombre_usuario,
      format: row.extension as RecentExport['format'],
      urlReport: row.url_archivo
    }));

    return { data, totalCount };
  });
