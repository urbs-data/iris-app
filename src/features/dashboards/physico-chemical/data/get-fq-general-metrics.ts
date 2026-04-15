'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { fqBaseFiltersSchema } from './shared-schemas';
import type { FQGeneralMetrics } from '../types';
import { sql } from 'drizzle-orm';

interface QueryRow extends Record<string, unknown> {
  cantidad_registros: number;
  promedio_valor: number;
  minimo_valor: number;
  maximo_valor: number;
  unidad_medicion: string | null;
  ultimo_valor: number | null;
}

export const getFqGeneralMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getFqGeneralMetrics' })
  .inputSchema(fqBaseFiltersSchema)
  .action(async ({ parsedInput, ctx }): Promise<FQGeneralMetrics> => {
    const wells =
      parsedInput.wells && parsedInput.wells.length > 0
        ? parsedInput.wells.map((w) => w.toLowerCase())
        : null;

    const query = sql`
      WITH raw_pozos AS (
        SELECT *
        FROM pozos
        WHERE tipo IN ('WELL', 'PUMP')
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
      ),
      ultimo_valor AS (
        SELECT fq.valor_medicion
        FROM raw_fq fq
          INNER JOIN raw_pozos p ON LOWER(fq.id_pozo) = LOWER(p.id_pozo)
        ORDER BY fq.fecha_hora_medicion DESC
        LIMIT 1
      ),
      datos_calculados AS (
        SELECT
          MAX(fq.unidad_medicion) AS unidad_medicion,
          COUNT(*) AS cantidad_registros,
          ROUND(AVG(fq.valor_medicion)::numeric, 2)::real AS promedio_valor,
          ROUND(MIN(fq.valor_medicion)::numeric, 2)::real AS minimo_valor,
          ROUND(MAX(fq.valor_medicion)::numeric, 2)::real AS maximo_valor
        FROM raw_fq fq
          INNER JOIN raw_pozos p ON LOWER(fq.id_pozo) = LOWER(p.id_pozo)
      )
      SELECT
        dc.unidad_medicion,
        dc.cantidad_registros,
        dc.promedio_valor,
        dc.minimo_valor,
        dc.maximo_valor,
        ROUND((SELECT valor_medicion FROM ultimo_valor LIMIT 1)::numeric, 2)::real AS ultimo_valor
      FROM datos_calculados dc
    `;

    const results = await ctx.db.execute<QueryRow>(query);

    if (results.rows.length === 0 || results.rows[0].cantidad_registros === 0) {
      return {
        lastValue: 0,
        average: 0,
        min: 0,
        max: 0,
        unit: '',
        sampleCount: 0
      };
    }

    const row = results.rows[0];

    return {
      lastValue: row.ultimo_valor ?? 0,
      average: row.promedio_valor ?? 0,
      min: row.minimo_valor ?? 0,
      max: row.maximo_valor ?? 0,
      unit: row.unidad_medicion ?? '',
      sampleCount: row.cantidad_registros ?? 0
    };
  });
