'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { fqBaseFiltersSchema } from './shared-schemas';
import type { FQDailyMetricsResult } from '../types';
import { sql } from 'drizzle-orm';
import { parseISO } from 'date-fns';
import { logger } from '@/lib/logger';

interface QueryRow extends Record<string, unknown> {
  periodo: string;
  unidad_medicion: string | null;
  promedio_valor: number;
}

export const getFqDailyMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getFqDailyMetrics' })
  .inputSchema(fqBaseFiltersSchema)
  .action(async ({ parsedInput, ctx }): Promise<FQDailyMetricsResult> => {
    const wells =
      parsedInput.wells && parsedInput.wells.length > 0
        ? parsedInput.wells.map((w) => w.toLowerCase())
        : null;

    const query = sql`
      WITH raw_pozos AS (
        SELECT *
        FROM pozos
        WHERE tipo = 'WELL'
          AND tipo = 'WELL'
          ${parsedInput.area ? sql`AND area = ${parsedInput.area}` : sql``}
          ${wells ? sql`AND LOWER(id_pozo) IN ${sql.raw(`(${wells.map((w) => `'${w}'`).join(',')})`)}` : sql``}
      ),
      raw_fq AS (
        SELECT *
        FROM parametros_fisico_quimicos_new
        WHERE valor_medicion IS NOT NULL
          ${parsedInput.parametro ? sql`AND parametro = ${parsedInput.parametro}` : sql``}
          ${parsedInput.dateFrom ? sql`AND fecha_hora_medicion >= ${parsedInput.dateFrom}::timestamp` : sql``}
          ${parsedInput.dateTo ? sql`AND fecha_hora_medicion <= ${parsedInput.dateTo}::timestamp` : sql``}
      )
      SELECT
        fq.fecha_hora_medicion::date AS periodo,
        MAX(fq.unidad_medicion) AS unidad_medicion,
        ROUND(AVG(fq.valor_medicion)::numeric, 2)::real AS promedio_valor
      FROM raw_fq fq
        INNER JOIN raw_pozos p ON LOWER(fq.id_pozo) = LOWER(p.id_pozo)
      GROUP BY fq.fecha_hora_medicion::date
      ORDER BY periodo
    `;

    const results = await ctx.db.execute<QueryRow>(query);

    const unit =
      results.rows.length > 0 ? (results.rows[0].unidad_medicion ?? '') : '';

    const data = results.rows.map((row) => ({
      date: parseISO(row.periodo),
      value: row.promedio_valor,
      unit
    }));

    logger('data', data);

    return { data, unit };
  });
