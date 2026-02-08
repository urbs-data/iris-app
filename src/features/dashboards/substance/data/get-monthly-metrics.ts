'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getMonthlyMetricsSchema } from './get-monthly-metrics-schema';
import type { MonthlyConcentration } from '../types';
import { sql } from 'drizzle-orm';
import { parseISO } from 'date-fns';

interface MonthlyMetricsResult {
  data: MonthlyConcentration[];
  guideLevel: number;
  unit: string;
}

interface QueryRow extends Record<string, unknown> {
  periodo: string;
  unidad: string | null;
  nivel_guia: number | null;
  cantidad_registros: number;
  promedio_concentracion: number;
  desvio_concentracion: number | null;
  minimo_concentracion: number;
  maximo_concentracion: number;
  mediana_concentracion: number;
  proporcion_max_promedio: number;
  proporcion_nivel_guia: number | null;
}

export const getMonthlyMetrics = authOrganizationActionClient
  .metadata({ actionName: 'getMonthlyMetrics' })
  .inputSchema(getMonthlyMetricsSchema)
  .action(async ({ parsedInput, ctx }): Promise<MonthlyMetricsResult> => {
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
          AND fecha >= '2024-07-01'
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
      promedios_periodo AS (
        SELECT TO_CHAR(m.fecha, 'YYYY-MM') AS periodo,
          c.unidad,
          AVG(
            COALESCE(
              c.concentracion,
              CASE 
                WHEN c.limite_deteccion ~ '^[0-9]+\.?[0-9]*$' 
                THEN CAST(c.limite_deteccion AS real)
                ELSE NULL
              END
            )
          ) AS promedio_concentracion
        FROM raw_concentraciones c
          INNER JOIN raw_muestras m ON c.id_muestra = m.id_muestra
          INNER JOIN raw_estudios_pozos e ON m.id_estudio_pozo = e.id_estudio_pozo
          INNER JOIN raw_pozos p ON LOWER(e.id_pozo) = LOWER(p.id_pozo)
        GROUP BY TO_CHAR(m.fecha, 'YYYY-MM'), c.unidad
      ),
      datos_calculados AS (
        SELECT 
          TO_CHAR(m.fecha, 'YYYY-MM') AS periodo,
          c.unidad,
          MAX(
            CASE 
              WHEN ${tipoMuestra} = 'Suelo' THEN s.nivel_guia_suelo
              ELSE s.nivel_guia
            END
          ) AS nivel_guia,
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
          INNER JOIN raw_sustancias s ON c.id_sustancia = s.id_sustancia
        GROUP BY TO_CHAR(m.fecha, 'YYYY-MM'), c.unidad
      ),
      datos_con_proporciones AS (
        SELECT 
          dc.*,
          dc.promedio_concentracion / NULLIF((
            SELECT MAX(promedio_concentracion)
            FROM promedios_periodo
          ), 0) AS proporcion_max_promedio,
          CASE
            WHEN dc.nivel_guia IS NOT NULL AND dc.nivel_guia > 0 THEN 
              dc.promedio_concentracion / dc.nivel_guia
            ELSE NULL
          END AS proporcion_nivel_guia
        FROM datos_calculados dc
      )
      SELECT DISTINCT periodo,
        unidad,
        nivel_guia,
        cantidad_registros,
        ROUND(promedio_concentracion::numeric, 2)::real AS promedio_concentracion,
        ROUND(desvio_concentracion::numeric, 2)::real AS desvio_concentracion,
        ROUND(minimo_concentracion::numeric, 2)::real AS minimo_concentracion,
        ROUND(maximo_concentracion::numeric, 2)::real AS maximo_concentracion,
        ROUND(mediana_concentracion::numeric, 4)::real AS mediana_concentracion,
        ROUND(proporcion_max_promedio::numeric, 4)::real AS proporcion_max_promedio,
        ROUND(proporcion_nivel_guia::numeric, 4)::real AS proporcion_nivel_guia
      FROM datos_con_proporciones
      ORDER BY periodo
    `;

    const results = await ctx.db.execute<QueryRow>(query);

    const guideLevel =
      results.rows.length > 0 ? (results.rows[0].nivel_guia ?? 100) : 100;

    const unit =
      results.rows.length > 0 ? (results.rows[0].unidad ?? 'µg/l') : 'µg/l';

    const data: MonthlyConcentration[] = results.rows.map((row) => ({
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
