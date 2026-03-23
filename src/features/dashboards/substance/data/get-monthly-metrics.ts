'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getMonthlyMetricsSchema } from './get-monthly-metrics-schema';
import type { Concentration } from '../types';
import { mapWellType } from '../lib/map-well-type';
import { sql } from 'drizzle-orm';
import { parseISO } from 'date-fns';

interface MonthlyMetricsResult {
  data: Concentration[];
  guideLevel: number;
  unit: string;
}

interface QueryRow extends Record<string, unknown> {
  periodo: string;
  unidad: string | null;
  nivel_guia: number | null;
  promedio_concentracion: number;
}

export const getMonthlyMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getMonthlyMetrics' })
  .inputSchema(getMonthlyMetricsSchema)
  .action(async ({ parsedInput, ctx }): Promise<MonthlyMetricsResult> => {
    const tipoPozo = parsedInput.wellType
      ? mapWellType(parsedInput.wellType)
      : null;
    const tipoMuestra = parsedInput.sampleType;
    const wells =
      parsedInput.wells && parsedInput.wells.length > 0
        ? parsedInput.wells.map((w) => w.toLowerCase())
        : null;

    const query = sql`
      SELECT
        TO_CHAR(f.fecha, 'YYYY-MM') AS periodo,
        f.unidad,
        MAX(f.nivel_guia) AS nivel_guia,
        ROUND(AVG(f.concentracion)::numeric, 2)::real AS promedio_concentracion
      FROM dwh.fact_concentraciones_agua f
        INNER JOIN dwh.dim_muestras dm ON f.muestra = dm.muestra
        INNER JOIN dwh.dim_pozos dp ON LOWER(f.id_pozo) = LOWER(dp.id_pozo)
      WHERE dm.tipo = 'Muestreo'
        AND dm.matriz = ${tipoMuestra}
        AND dp.tipo_pozo IN ('Pozo monitoreo', 'Pozo bombeo')
        ${parsedInput.substance ? sql`AND f.id_sustancia = ${parsedInput.substance}` : sql``}
        ${parsedInput.dateFrom ? sql`AND f.fecha >= ${parsedInput.dateFrom}::timestamp` : sql``}
        ${parsedInput.dateTo ? sql`AND f.fecha <= ${parsedInput.dateTo}::timestamp` : sql``}
        ${parsedInput.area ? sql`AND dp.area = ${parsedInput.area}` : sql``}
        ${tipoPozo ? sql`AND dp.tipo_pozo = ${tipoPozo}` : sql``}
        ${wells ? sql`AND LOWER(f.id_pozo) IN ${sql.raw(`(${wells.map((w) => `'${w}'`).join(',')})`)}` : sql``}
      GROUP BY TO_CHAR(f.fecha, 'YYYY-MM'), f.unidad
      ORDER BY periodo
    `;

    const results = await ctx.db.execute<QueryRow>(query);

    const guideLevel =
      results.rows.length > 0 ? (results.rows[0].nivel_guia ?? 100) : 100;

    const unit =
      results.rows.length > 0 ? (results.rows[0].unidad ?? 'µg/l') : 'µg/l';

    const data: Concentration[] = results.rows.map((row) => ({
      date: parseISO(row.periodo + '-01'),
      value: row.promedio_concentracion,
      unit
    }));

    return {
      data,
      guideLevel,
      unit
    };
  });
