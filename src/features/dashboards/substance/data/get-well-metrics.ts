'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getWellMetricsSchema } from './get-well-metrics-schema';
import type { WellMetrics, WellMetricsResult } from '../types';
import { mapWellType } from '../lib/map-well-type';
import { sql } from 'drizzle-orm';

interface QueryRow extends Record<string, unknown> {
  pozo: string;
  latitud: number | null;
  longitud: number | null;
  unidad: string;
  nivel_guia: number | null;
  primer_periodo: string;
  ultimo_periodo: string;
  cantidad_registros: number;
  promedio_concentracion: number;
  desvio_concentracion: number;
  minimo_concentracion: number;
  maximo_concentracion: number;
  mediana_concentracion: number;
}

export const getWellMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getWellMetrics' })
  .inputSchema(getWellMetricsSchema)
  .action(async ({ parsedInput, ctx }): Promise<WellMetricsResult> => {
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
          f.id_pozo,
          dp.latitud,
          dp.longitud,
          f.fecha,
          f.unidad,
          f.nivel_guia,
          f.concentracion
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
      ),
      ultimo_periodo_por_pozo AS (
        SELECT
          LOWER(id_pozo) AS id_pozo,
          TO_CHAR(MAX(fecha), 'YYYY-MM') AS ultimo_periodo
        FROM base
        GROUP BY LOWER(id_pozo)
      ),
      max_ultimo_periodo AS (
        SELECT
          LOWER(b.id_pozo) AS id_pozo,
          MAX(b.concentracion) AS maximo_concentracion_ultimo
        FROM base b
          INNER JOIN ultimo_periodo_por_pozo up ON LOWER(b.id_pozo) = up.id_pozo
        WHERE TO_CHAR(b.fecha, 'YYYY-MM') = up.ultimo_periodo
        GROUP BY LOWER(b.id_pozo)
      ),
      datos_calculados AS (
        SELECT
          b.id_pozo AS pozo,
          b.latitud,
          b.longitud,
          b.unidad,
          MAX(b.nivel_guia) AS nivel_guia,
          TO_CHAR(MIN(b.fecha), 'YYYY-MM') AS primer_periodo,
          TO_CHAR(MAX(b.fecha), 'YYYY-MM') AS ultimo_periodo,
          COUNT(*) AS cantidad_registros,
          AVG(b.concentracion) AS promedio_concentracion,
          STDDEV_SAMP(b.concentracion) AS desvio_concentracion,
          MIN(b.concentracion) AS minimo_concentracion,
          MAX(mup.maximo_concentracion_ultimo) AS maximo_concentracion,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY b.concentracion) AS mediana_concentracion
        FROM base b
          LEFT JOIN max_ultimo_periodo mup ON LOWER(b.id_pozo) = mup.id_pozo
        GROUP BY b.id_pozo, b.latitud, b.longitud, b.unidad
      )
      SELECT
        pozo,
        latitud,
        longitud,
        unidad,
        nivel_guia,
        primer_periodo,
        ultimo_periodo,
        cantidad_registros,
        ROUND(promedio_concentracion::numeric, 2)::real AS promedio_concentracion,
        ROUND(COALESCE(desvio_concentracion, 0)::numeric, 2)::real AS desvio_concentracion,
        ROUND(minimo_concentracion::numeric, 2)::real AS minimo_concentracion,
        ROUND(maximo_concentracion::numeric, 2)::real AS maximo_concentracion,
        ROUND(mediana_concentracion::numeric, 2)::real AS mediana_concentracion
      FROM datos_calculados
      WHERE latitud IS NOT NULL
        AND longitud IS NOT NULL
      ORDER BY pozo
    `;

    const results = await ctx.db.execute<QueryRow>(query);

    const guideLevel =
      results.rows.length > 0 ? (results.rows[0].nivel_guia ?? 100) : 100;

    const data: WellMetrics[] = results.rows.map((row) => ({
      wellId: row.pozo,
      lat: row.latitud ?? 0,
      lng: row.longitud ?? 0,
      unit: row.unidad,
      firstPeriod: row.primer_periodo,
      lastPeriod: row.ultimo_periodo,
      sampleCount: row.cantidad_registros,
      mean: row.promedio_concentracion,
      stdDev: row.desvio_concentracion,
      min: row.minimo_concentracion,
      max: row.maximo_concentracion,
      median: row.mediana_concentracion
    }));

    return {
      data,
      guideLevel
    };
  });
