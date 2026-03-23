'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getGeneralMetricsSchema } from './get-general-metrics-schema';
import type { GeneralMetrics } from '../types';
import { mapWellType } from '../lib/map-well-type';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface QueryRow extends Record<string, unknown> {
  cantidad_registros: number;
  promedio_concentracion: number;
  desvio_concentracion: number | null;
  minimo_concentracion: number;
  maximo_concentracion: number;
  mediana_concentracion: number;
  nivel_guia: number | null;
  max_promedio: number | null;
  ultimo_promedio_mensual: number | null;
  max_promedio_mensual: number | null;
  unidad: string | null;
}

export const getGeneralMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getGeneralMetrics' })
  .inputSchema(getGeneralMetricsSchema)
  .action(async ({ parsedInput, ctx }): Promise<GeneralMetrics> => {
    const tipoPozo = parsedInput.wellType
      ? mapWellType(parsedInput.wellType)
      : null;
    const tipoMuestra = parsedInput.sampleType;
    const wells =
      parsedInput.wells && parsedInput.wells.length > 0
        ? parsedInput.wells.map((w) => w.toLowerCase())
        : null;

    const query = sql`
      WITH base AS (
        SELECT
          f.id_sustancia,
          f.unidad,
          f.fecha,
          f.concentracion,
          f.nivel_guia
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
      ),
      datos_por_sustancia AS (
        SELECT
          id_sustancia,
          unidad,
          COUNT(*) AS cantidad_registros,
          AVG(concentracion) AS promedio_concentracion,
          STDDEV_SAMP(concentracion) AS desvio_concentracion,
          MIN(concentracion) AS minimo_concentracion,
          MAX(concentracion) AS maximo_concentracion,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY concentracion) AS mediana_concentracion,
          MAX(nivel_guia) AS nivel_guia
        FROM base
        GROUP BY id_sustancia, unidad
      ),
      datos_agregados AS (
        SELECT
          MAX(unidad) AS unidad,
          SUM(cantidad_registros) AS cantidad_registros,
          AVG(promedio_concentracion) AS promedio_concentracion,
          SQRT(AVG(desvio_concentracion * desvio_concentracion)) AS desvio_concentracion,
          MIN(minimo_concentracion) AS minimo_concentracion,
          MAX(maximo_concentracion) AS maximo_concentracion,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY mediana_concentracion) AS mediana_concentracion,
          MAX(nivel_guia) AS nivel_guia,
          MAX(promedio_concentracion) AS max_promedio
        FROM datos_por_sustancia
      ),
      promedios_mensuales AS (
        SELECT
          TO_CHAR(fecha, 'YYYY-MM') AS periodo,
          AVG(concentracion) AS promedio_concentracion
        FROM base
        GROUP BY TO_CHAR(fecha, 'YYYY-MM')
      ),
      ultimo_promedio AS (
        SELECT promedio_concentracion
        FROM promedios_mensuales
        WHERE periodo = (SELECT MAX(periodo) FROM promedios_mensuales)
        LIMIT 1
      ),
      max_promedio_periodos AS (
        SELECT MAX(promedio_concentracion) AS max_promedio_mensual
        FROM promedios_mensuales
      )
      SELECT
        da.unidad,
        da.cantidad_registros,
        ROUND(da.promedio_concentracion::numeric, 2)::real AS promedio_concentracion,
        ROUND(COALESCE(da.desvio_concentracion, 0)::numeric, 2)::real AS desvio_concentracion,
        ROUND(da.minimo_concentracion::numeric, 2)::real AS minimo_concentracion,
        ROUND(da.maximo_concentracion::numeric, 2)::real AS maximo_concentracion,
        ROUND(da.mediana_concentracion::numeric, 2)::real AS mediana_concentracion,
        da.nivel_guia,
        da.max_promedio,
        ROUND(COALESCE((SELECT promedio_concentracion FROM ultimo_promedio LIMIT 1), 0)::numeric, 2)::real AS ultimo_promedio_mensual,
        ROUND(COALESCE((SELECT max_promedio_mensual FROM max_promedio_periodos LIMIT 1), 0)::numeric, 2)::real AS max_promedio_mensual
      FROM datos_agregados da
    `;

    const results = await ctx.db.execute<QueryRow>(query);

    if (results.rows.length === 0) {
      return {
        samples: 0,
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        guideLevel: 0,
        vsGuidePercent: 0,
        vsMaxPercent: 0,
        lastMonthlyAverage: 0,
        maxMonthlyAverage: 0,
        unit: 'µg/l'
      };
    }

    const row = results.rows[0];
    const samples = row.cantidad_registros ?? 0;
    const average = row.promedio_concentracion ?? 0;
    const median = row.mediana_concentracion ?? 0;
    const min = row.minimo_concentracion ?? 0;
    const max = row.maximo_concentracion ?? 0;
    const stdDev = row.desvio_concentracion ?? 0;
    const guideLevel = row.nivel_guia ?? 0;
    const ultimoPromedioMensual = row.ultimo_promedio_mensual ?? average;
    const maxPromedioMensual = row.max_promedio_mensual ?? average;
    const unit = row.unidad ?? 'µg/l';

    const vsGuidePercent =
      guideLevel > 0 ? (ultimoPromedioMensual / guideLevel) * 100 : 0;
    const vsMaxPercent =
      maxPromedioMensual > 0
        ? (ultimoPromedioMensual / maxPromedioMensual - 1) * 100
        : 0;

    return {
      samples,
      average,
      median,
      min,
      max,
      stdDev,
      guideLevel,
      vsGuidePercent,
      vsMaxPercent,
      lastMonthlyAverage: ultimoPromedioMensual,
      maxMonthlyAverage: maxPromedioMensual,
      unit
    };
  });
