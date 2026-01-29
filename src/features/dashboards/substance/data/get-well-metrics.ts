'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getWellMetricsSchema } from './get-well-metrics-schema';
import type { WellMetrics, WellMetricsResult } from '../types';
import { sql } from 'drizzle-orm';

interface QueryRow extends Record<string, unknown> {
  pozo: string;
  latitud_decimal: number | null;
  longitud_decimal: number | null;
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
    const tipoPozo = parsedInput.wellType ?? null;
    const tipoMuestra = parsedInput.sampleType;
    const wells =
      parsedInput.wells && parsedInput.wells.length > 0
        ? parsedInput.wells.map((w) => w.toLowerCase())
        : null;

    const query = sql`
      WITH raw_muestras AS (
        SELECT *
        FROM muestras
        WHERE tipo = ${tipoMuestra}
          ${parsedInput.dateFrom ? sql`AND fecha >= ${parsedInput.dateFrom}::timestamp` : sql``}
          ${parsedInput.dateTo ? sql`AND fecha <= ${parsedInput.dateTo}::timestamp` : sql``}
      ),
      raw_concentraciones AS (
        SELECT *
        FROM concentraciones
        ${parsedInput.substance ? sql`WHERE id_sustancia = ${parsedInput.substance}` : sql``}
      ),
      raw_pozos AS (
        SELECT *
        FROM pozos
        WHERE tipo IN ('WELL', 'PUMP')
          ${parsedInput.area ? sql`AND area = ${parsedInput.area}` : sql``}
          ${tipoPozo ? sql`AND tipo = ${tipoPozo}` : sql``}
          ${wells ? sql`AND LOWER(id_pozo) IN ${sql.raw(`(${wells.map((w) => `'${w}'`).join(',')})`)}` : sql``}
      ),
      raw_estudios_pozos AS (
        SELECT *
        FROM estudios_pozos
      ),
      raw_sustancias AS (
        SELECT *
        FROM sustancias
      ),
      datos_con_limite AS (
        SELECT 
          p.id_pozo,
          p.latitud_decimal,
          p.longitud_decimal,
          m.fecha,
          c.unidad,
          CASE 
            WHEN ${tipoMuestra} = 'Suelo' THEN s.nivel_guia_suelo
            ELSE s.nivel_guia
          END AS nivel_guia,
          COALESCE(
            c.concentracion,
            CASE 
              WHEN c.limite_deteccion ~ '^[0-9]+\.?[0-9]*$' 
              THEN CAST(c.limite_deteccion AS real)
              ELSE NULL
            END
          ) AS valor_concentracion
        FROM raw_concentraciones c
          INNER JOIN raw_muestras m ON c.id_muestra = m.id_muestra
          INNER JOIN raw_estudios_pozos e ON m.id_estudio_pozo = e.id_estudio_pozo
          INNER JOIN raw_pozos p ON LOWER(e.id_pozo) = LOWER(p.id_pozo)
          INNER JOIN raw_sustancias s ON c.id_sustancia = s.id_sustancia
        WHERE COALESCE(
          c.concentracion,
          CASE 
            WHEN c.limite_deteccion ~ '^[0-9]+\.?[0-9]*$' 
            THEN CAST(c.limite_deteccion AS real)
            ELSE NULL
          END
        ) IS NOT NULL
      ),
      ultimo_periodo_por_pozo AS (
        SELECT 
          LOWER(id_pozo) as id_pozo,
          TO_CHAR(MAX(fecha), 'YYYY-MM') as ultimo_periodo
        FROM datos_con_limite
        GROUP BY LOWER(id_pozo)
      ),
      max_ultimo_periodo AS (
        SELECT 
          LOWER(d.id_pozo) as id_pozo,
          MAX(d.valor_concentracion) as maximo_concentracion_ultimo
        FROM datos_con_limite d
          INNER JOIN ultimo_periodo_por_pozo up ON LOWER(d.id_pozo) = up.id_pozo
        WHERE TO_CHAR(d.fecha, 'YYYY-MM') = up.ultimo_periodo
        GROUP BY LOWER(d.id_pozo)
      ),
      datos_calculados AS (
        SELECT 
          d.id_pozo as pozo,
          d.latitud_decimal,
          d.longitud_decimal,
          d.unidad,
          MAX(d.nivel_guia) as nivel_guia,
          TO_CHAR(MIN(d.fecha), 'YYYY-MM') as primer_periodo,
          TO_CHAR(MAX(d.fecha), 'YYYY-MM') as ultimo_periodo,
          COUNT(*) AS cantidad_registros,
          AVG(d.valor_concentracion) AS promedio_concentracion,
          STDDEV_SAMP(d.valor_concentracion) AS desvio_concentracion,
          MIN(d.valor_concentracion) AS minimo_concentracion,
          MAX(mup.maximo_concentracion_ultimo) AS maximo_concentracion,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY d.valor_concentracion) AS mediana_concentracion
        FROM datos_con_limite d
          LEFT JOIN max_ultimo_periodo mup ON LOWER(d.id_pozo) = mup.id_pozo
        GROUP BY d.id_pozo, d.latitud_decimal, d.longitud_decimal, d.unidad
      )
      SELECT 
        pozo,
        latitud_decimal,
        longitud_decimal,
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
      WHERE latitud_decimal IS NOT NULL
        AND longitud_decimal IS NOT NULL
      ORDER BY pozo
    `;

    const results = await ctx.db.execute<QueryRow>(query);

    const guideLevel =
      results.rows.length > 0 ? (results.rows[0].nivel_guia ?? 100) : 100;

    const data: WellMetrics[] = results.rows.map((row) => ({
      wellId: row.pozo,
      lat: row.latitud_decimal ?? 0,
      lng: row.longitud_decimal ?? 0,
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
