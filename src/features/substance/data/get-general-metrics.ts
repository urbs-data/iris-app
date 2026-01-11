'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getGeneralMetricsSchema } from './get-general-metrics-schema';
import type { GeneralMetrics } from '../types';
import { sql } from 'drizzle-orm';

interface QueryRow extends Record<string, unknown> {
  cantidad_registros: number;
  promedio_concentracion: number;
  desvio_concentracion: number | null;
  minimo_concentracion: number;
  maximo_concentracion: number;
  mediana_concentracion: number;
  nivel_guia: number | null;
  max_promedio: number | null;
}

export const getGeneralMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getGeneralMetrics' })
  .inputSchema(getGeneralMetricsSchema)
  .action(async ({ parsedInput, ctx }): Promise<GeneralMetrics> => {
    const tipoPozo = parsedInput.wellType ?? null;
    const tipoMuestra = parsedInput.sampleType;

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
          ${parsedInput.well ? sql`AND LOWER(id_pozo) = LOWER(${parsedInput.well})` : sql``}
      ),
      raw_estudios_pozos AS (
        SELECT *
        FROM estudios_pozos
      ),
      raw_sustancias AS (
        SELECT *
        FROM sustancias
      ),
      datos_calculados_por_sustancia AS (
        SELECT 
          c.id_sustancia,
          COUNT(*) AS cantidad_registros,
          AVG(
            COALESCE(
              c.concentracion,
              CASE 
                WHEN c.limite_deteccion ~ '^[0-9]+\.?[0-9]*$' 
                THEN CAST(c.limite_deteccion AS real)
                ELSE NULL
              END
            )
          ) AS promedio_concentracion,
          STDDEV_SAMP(
            COALESCE(
              c.concentracion,
              CASE 
                WHEN c.limite_deteccion ~ '^[0-9]+\.?[0-9]*$' 
                THEN CAST(c.limite_deteccion AS real)
                ELSE NULL
              END
            )
          ) AS desvio_concentracion,
          MIN(
            COALESCE(
              c.concentracion,
              CASE 
                WHEN c.limite_deteccion ~ '^[0-9]+\.?[0-9]*$' 
                THEN CAST(c.limite_deteccion AS real)
                ELSE NULL
              END
            )
          ) AS minimo_concentracion,
          MAX(
            COALESCE(
              c.concentracion,
              CASE 
                WHEN c.limite_deteccion ~ '^[0-9]+\.?[0-9]*$' 
                THEN CAST(c.limite_deteccion AS real)
                ELSE NULL
              END
            )
          ) AS maximo_concentracion,
          PERCENTILE_CONT(0.5) WITHIN GROUP (
            ORDER BY COALESCE(
              c.concentracion,
              CASE 
                WHEN c.limite_deteccion ~ '^[0-9]+\.?[0-9]*$' 
                THEN CAST(c.limite_deteccion AS real)
                ELSE NULL
              END
            )
          ) AS mediana_concentracion
        FROM raw_concentraciones c
          INNER JOIN raw_muestras m ON c.id_muestra = m.id_muestra
          INNER JOIN raw_estudios_pozos e ON m.id_estudio_pozo = e.id_estudio_pozo
          INNER JOIN raw_pozos p ON LOWER(e.id_pozo) = LOWER(p.id_pozo)
        GROUP BY c.id_sustancia
      ),
      datos_agregados AS (
        SELECT 
          SUM(dc.cantidad_registros) AS cantidad_registros,
          AVG(dc.promedio_concentracion) AS promedio_concentracion,
          SQRT(AVG(dc.desvio_concentracion * dc.desvio_concentracion)) AS desvio_concentracion,
          MIN(dc.minimo_concentracion) AS minimo_concentracion,
          MAX(dc.maximo_concentracion) AS maximo_concentracion,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY dc.mediana_concentracion) AS mediana_concentracion,
          MAX(s.nivel_guia) AS nivel_guia,
          MAX(dc.promedio_concentracion) AS max_promedio
        FROM datos_calculados_por_sustancia dc
          INNER JOIN raw_sustancias s ON dc.id_sustancia = s.id_sustancia
      )
      SELECT 
        cantidad_registros,
        ROUND(promedio_concentracion::numeric, 2)::real AS promedio_concentracion,
        ROUND(COALESCE(desvio_concentracion, 0)::numeric, 2)::real AS desvio_concentracion,
        ROUND(minimo_concentracion::numeric, 2)::real AS minimo_concentracion,
        ROUND(maximo_concentracion::numeric, 2)::real AS maximo_concentracion,
        ROUND(mediana_concentracion::numeric, 2)::real AS mediana_concentracion,
        nivel_guia,
        max_promedio
      FROM datos_agregados
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
        vsMaxPercent: 0
      };
    }

    const row = results.rows[0];
    const samples = row.cantidad_registros;
    const average = row.promedio_concentracion ?? 0;
    const median = row.mediana_concentracion ?? 0;
    const min = row.minimo_concentracion ?? 0;
    const max = row.maximo_concentracion ?? 0;
    const stdDev = row.desvio_concentracion ?? 0;
    const guideLevel = row.nivel_guia ?? 0;
    const maxPromedio = row.max_promedio ?? average;

    // Calcular porcentajes
    const vsGuidePercent = guideLevel > 0 ? (average / guideLevel) * 100 : 0;
    const vsMaxPercent =
      maxPromedio > 0 ? ((average - maxPromedio) / maxPromedio) * 100 : 0;

    return {
      samples,
      average,
      median,
      min,
      max,
      stdDev,
      guideLevel,
      vsGuidePercent,
      vsMaxPercent
    };
  });
