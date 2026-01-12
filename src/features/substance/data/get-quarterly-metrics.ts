'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getQuarterlyMetricsSchema } from './get-quarterly-metrics-schema';
import type { QuarterlyStats } from '../types';
import { sql } from 'drizzle-orm';

interface QuarterlyMetricsResult {
  data: QuarterlyStats[];
  guideLevel: number;
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
      datos_con_anio AS (
        SELECT 
          EXTRACT(YEAR FROM m.fecha)::text AS anio,
          c.unidad,
          s.nivel_guia,
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
      datos_calculados AS (
        SELECT 
          anio,
          unidad,
          MAX(nivel_guia) AS nivel_guia,
          COUNT(*) AS cantidad_registros,
          MIN(valor_concentracion) AS minimo_concentracion,
          AVG(valor_concentracion) AS promedio_concentracion,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY valor_concentracion) AS q1_concentracion,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY valor_concentracion) AS mediana_concentracion,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY valor_concentracion) AS q3_concentracion,
          MAX(valor_concentracion) AS maximo_concentracion
        FROM datos_con_anio
        GROUP BY anio, unidad
      )
      SELECT 
        anio,
        unidad,
        nivel_guia,
        cantidad_registros,
        ROUND(minimo_concentracion::numeric, 2)::real AS minimo_concentracion,
        ROUND(q1_concentracion::numeric, 2)::real AS q1_concentracion,
        ROUND(mediana_concentracion::numeric, 2)::real AS mediana_concentracion,
        ROUND(promedio_concentracion::numeric, 2)::real AS promedio_concentracion,
        ROUND(q3_concentracion::numeric, 2)::real AS q3_concentracion,
        ROUND(maximo_concentracion::numeric, 2)::real AS maximo_concentracion
      FROM datos_calculados
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
      mean: row.promedio_concentracion
    }));

    return {
      data,
      guideLevel
    };
  });
