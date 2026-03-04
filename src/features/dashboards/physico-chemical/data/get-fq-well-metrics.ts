'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { fqBaseFiltersSchema } from './shared-schemas';
import type { FQWellMetricsResult } from '../types';
import { sql } from 'drizzle-orm';

interface QueryRow extends Record<string, unknown> {
  pozo: string;
  latitud_decimal: number | null;
  longitud_decimal: number | null;
  unidad_medicion: string | null;
  cantidad_registros: number;
  promedio_valor: number;
  minimo_valor: number;
  maximo_valor: number;
}

export const getFqWellMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getFqWellMetrics' })
  .inputSchema(fqBaseFiltersSchema)
  .action(async ({ parsedInput, ctx }): Promise<FQWellMetricsResult> => {
    const wells =
      parsedInput.wells && parsedInput.wells.length > 0
        ? parsedInput.wells.map((w) => w.toLowerCase())
        : null;

    const query = sql`
      WITH raw_pozos AS (
        SELECT *
        FROM pozos
        WHERE tipo IN ('WELL', 'PUMP')
          ${parsedInput.area ? sql`AND area = ${parsedInput.area}` : sql``}
          ${parsedInput.wellType ? sql`AND tipo = ${parsedInput.wellType}` : sql``}
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
        fq.id_pozo AS pozo,
        p.latitud_decimal,
        p.longitud_decimal,
        MAX(fq.unidad_medicion) AS unidad_medicion,
        COUNT(*) AS cantidad_registros,
        ROUND(AVG(fq.valor_medicion)::numeric, 2)::real AS promedio_valor,
        ROUND(MIN(fq.valor_medicion)::numeric, 2)::real AS minimo_valor,
        ROUND(MAX(fq.valor_medicion)::numeric, 2)::real AS maximo_valor
      FROM raw_fq fq
        INNER JOIN raw_pozos p ON LOWER(fq.id_pozo) = LOWER(p.id_pozo)
      GROUP BY fq.id_pozo, p.latitud_decimal, p.longitud_decimal
      HAVING p.latitud_decimal IS NOT NULL
        AND p.longitud_decimal IS NOT NULL
      ORDER BY fq.id_pozo
    `;

    const results = await ctx.db.execute<QueryRow>(query);

    const data = results.rows.map((row) => ({
      wellId: row.pozo,
      lat: row.latitud_decimal ?? 0,
      lng: row.longitud_decimal ?? 0,
      unit: row.unidad_medicion ?? '',
      sampleCount: row.cantidad_registros,
      mean: row.promedio_valor,
      min: row.minimo_valor,
      max: row.maximo_valor
    }));

    return { data };
  });
