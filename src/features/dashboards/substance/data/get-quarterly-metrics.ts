'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getQuarterlyMetricsSchema } from './get-quarterly-metrics-schema';
import type { QuarterlyStats } from '../types';
import { mapWellType } from '../lib/map-well-type';
import { sql } from 'drizzle-orm';

interface QuarterlyMetricsResult {
  data: QuarterlyStats[];
  guideLevel: number;
  unit: string | null;
}

interface QueryRow extends Record<string, unknown> {
  anio: string;
  unidad: string | null;
  nivel_guia: number | null;
  cantidad_registros: number;
  minimo_concentracion: number;
  q1_concentracion: number;
  mediana_concentracion: number;
  promedio_concentracion: number;
  q3_concentracion: number;
  maximo_concentracion: number;
}

export const getQuarterlyMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getQuarterlyMetrics' })
  .inputSchema(getQuarterlyMetricsSchema)
  .action(async ({ parsedInput, ctx }): Promise<QuarterlyMetricsResult> => {
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
        EXTRACT(YEAR FROM f.fecha)::text AS anio,
        f.unidad,
        MAX(f.nivel_guia) AS nivel_guia,
        COUNT(*) AS cantidad_registros,
        ROUND(MIN(f.concentracion)::numeric, 2)::real AS minimo_concentracion,
        ROUND(AVG(f.concentracion)::numeric, 2)::real AS promedio_concentracion,
        ROUND((PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY f.concentracion))::numeric, 2)::real AS q1_concentracion,
        ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.concentracion))::numeric, 2)::real AS mediana_concentracion,
        ROUND((PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY f.concentracion))::numeric, 2)::real AS q3_concentracion,
        ROUND(MAX(f.concentracion)::numeric, 2)::real AS maximo_concentracion
      FROM dwh.fact_concentraciones_agua f
        INNER JOIN dwh.dim_muestras dm ON f.muestra = dm.muestra
        INNER JOIN dwh.dim_pozos dp ON LOWER(f.id_pozo) = LOWER(dp.id_pozo)
      WHERE dm.tipo = 'Muestreo'
        AND dm.matriz = ${tipoMuestra}
        AND dp.tipo_pozo IN ('Pozo monitoreo', 'Pozo bombeo')
        AND f.concentracion IS NOT NULL
        ${parsedInput.substance ? sql`AND f.id_sustancia = ${parsedInput.substance}` : sql``}
        ${parsedInput.dateFrom ? sql`AND f.fecha >= ${parsedInput.dateFrom}::timestamp` : sql``}
        ${parsedInput.dateTo ? sql`AND f.fecha <= ${parsedInput.dateTo}::timestamp` : sql``}
        ${parsedInput.area ? sql`AND dp.area = ${parsedInput.area}` : sql``}
        ${tipoPozo ? sql`AND dp.tipo_pozo = ${tipoPozo}` : sql``}
        ${wells ? sql`AND LOWER(f.id_pozo) IN ${sql.raw(`(${wells.map((w) => `'${w}'`).join(',')})`)}` : sql``}
      GROUP BY EXTRACT(YEAR FROM f.fecha), f.unidad
      ORDER BY anio
    `;

    const results = await ctx.db.execute<QueryRow>(query);

    const guideLevel =
      results.rows.length > 0 ? (results.rows[0].nivel_guia ?? 100) : 100;

    const data: QuarterlyStats[] = results.rows.map((row) => ({
      period: row.anio,
      min: row.minimo_concentracion,
      q1: row.q1_concentracion,
      median: row.mediana_concentracion,
      q3: row.q3_concentracion,
      max: row.maximo_concentracion,
      mean: row.promedio_concentracion,
      unit: row.unidad!
    }));

    const unit =
      results.rows.length > 0 ? (results.rows[0].unidad ?? null) : null;

    return {
      data,
      guideLevel,
      unit
    };
  });
