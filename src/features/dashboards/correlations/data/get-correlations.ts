'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getCorrelationsSchema } from './get-correlations-schema';
import { sql } from 'drizzle-orm';
import type {
  CorrelationResult,
  CorrelationRow,
  CorrelationParameter,
  ParameterName,
  SpearmanMatrix
} from '../types';
import { evaluateLOE, type ZVIPayload } from './evaluate-loe';
import { getLocale } from 'next-intl/server';
import {
  percentBelow,
  safeMedian,
  spearman,
  meanOfValues
} from '@/lib/statistics';

interface QueryRow extends Record<string, unknown> {
  id_pozo: string;
  fecha_muestra: Date;
  campana: string;
  id_sustancia: string;
  nombre_sustancia: string;
  limite_deteccion: number | null;
  limite_cuantificacion: number | null;
  nivel_guia: number | null;
  medicion_sustancia: number;
  unidad_sustancia: string;
  fecha_parametro: Date;
  parametro: string;
  medicion_parametro: number;
  unidad_parametro: string;
}

function campanaOrden(nombre: string): number {
  const upper = nombre.trim().toUpperCase();
  if (upper === 'LB') return 0;
  const match = upper.match(/^T(\d+)$/);
  if (match) return parseInt(match[1], 10);
  return 999;
}

function normalizeRow(row: QueryRow): CorrelationRow {
  return {
    pozo: row.id_pozo,
    sampleDate: new Date(row.fecha_muestra),
    campana: row.campana,
    substanceValue: row.medicion_sustancia,
    substanceUnit: row.unidad_sustancia,
    limiteDeteccion: row.limite_deteccion ?? null,
    limiteCuantificacion: row.limite_cuantificacion ?? null,
    nivelGuia: row.nivel_guia ?? null,
    parameterDate: new Date(row.fecha_parametro),
    parameterName: row.parametro,
    parameterValue: row.medicion_parametro,
    parameterUnit: row.unidad_parametro
  };
}

function groupByParameter(
  rows: CorrelationRow[]
): Map<string, CorrelationRow[]> {
  return rows.reduce((acc, row) => {
    const group = acc.get(row.parameterName) ?? [];
    group.push(row);
    acc.set(row.parameterName, group);
    return acc;
  }, new Map<string, CorrelationRow[]>());
}

function buildCorrelationParameter(
  name: string,
  rows: CorrelationRow[]
): CorrelationParameter {
  const xs = rows.map((r) => r.substanceValue);
  const ys = rows.map((r) => r.parameterValue);
  const { rho, p_valor, n } = spearman(xs, ys);
  return {
    name,
    unit: rows[0]?.parameterUnit ?? '',
    correlation: rho,
    pvalue: p_valor,
    samples: n,
    data: rows
  };
}

const VALID_PARAMETER_NAMES = new Set<ParameterName>([
  'ORP',
  'OD',
  'pH',
  'CE',
  'STD',
  'Temp'
]);

function isParameterName(name: string): name is ParameterName {
  return VALID_PARAMETER_NAMES.has(name as ParameterName);
}

type ParamValueIndex = Map<string, Map<string, number>>;

function buildParamValueIndex(
  grouped: Map<string, CorrelationRow[]>
): ParamValueIndex {
  return new Map(
    Array.from(grouped.entries()).map(([paramName, rows]) => [
      paramName,
      new Map(
        rows.map((row) => [
          `${row.pozo}|${row.parameterDate.toISOString()}`,
          row.parameterValue
        ])
      )
    ])
  );
}

function extractSharedPairs(
  aMap: Map<string, number>,
  bMap: Map<string, number>
): { xs: number[]; ys: number[] } {
  const sharedKeys = Array.from(aMap.keys()).filter((k) => bMap.has(k));
  return {
    xs: sharedKeys.map((k) => aMap.get(k)!),
    ys: sharedKeys.map((k) => bMap.get(k)!)
  };
}

function buildMatrix(
  paramNames: ParameterName[],
  index: ParamValueIndex
): SpearmanMatrix {
  return Object.fromEntries(
    paramNames.map((a) => {
      const aMap = index.get(a)!;
      const row = Object.fromEntries(
        paramNames
          .map((b): [string, number | undefined] => {
            if (a === b) return [b, 1.0];
            const bMap = index.get(b)!;
            const { xs, ys } = extractSharedPairs(aMap, bMap);
            const { rho } = spearman(xs, ys);
            return [b, Number.isNaN(rho) ? undefined : rho];
          })
          .filter((entry): entry is [string, number] => entry[1] !== undefined)
      );
      return [a, row];
    })
  ) as SpearmanMatrix;
}

// ─── Campañas ─────────────────────────────────────────────────────────────────

interface CampanaEntry {
  nombre: string;
  orden: number;
  pozos: Map<string, { valor: number; nivelGuia: number | null }>;
}

function buildCampaignMap(rows: CorrelationRow[]): Map<string, CampanaEntry> {
  const campaigns = new Map<string, CampanaEntry>();
  for (const row of rows) {
    if (!campaigns.has(row.campana)) {
      campaigns.set(row.campana, {
        nombre: row.campana,
        orden: campanaOrden(row.campana),
        pozos: new Map()
      });
    }
    campaigns.get(row.campana)!.pozos.set(row.pozo, {
      valor: row.substanceValue,
      nivelGuia: row.nivelGuia
    });
  }
  return campaigns;
}

interface CampaignStats {
  n_eventos: number;
  tendencia_lb: ZVIPayload['tendencia_lb'];
  cumplimiento_ultimo_evento: ZVIPayload['cumplimiento_ultimo_evento'];
}

function buildCumplimiento(
  pozos: Map<string, { valor: number; nivelGuia: number | null }> | undefined
): ZVIPayload['cumplimiento_ultimo_evento'] {
  if (!pozos) return null;
  const entries = Array.from(pozos.values());
  const ng = entries[0]?.nivelGuia ?? null;
  if (ng === null) return null;
  const valor_ug_L =
    Math.round(meanOfValues(entries.map((e) => e.valor)) * 100) / 100;
  const excede_ng = valor_ug_L >= ng;
  return {
    valor_ug_L,
    ng_ug_L: ng,
    excede_ng,
    estado_global: excede_ng ? 'EXCEDE' : 'CUMPLE'
  };
}

function calcCampaignStats(
  campaigns: Map<string, CampanaEntry>
): CampaignStats {
  const sorted = Array.from(campaigns.values()).sort(
    (a, b) => a.orden - b.orden
  );
  const n_eventos = sorted.length;

  if (n_eventos < 2) {
    return {
      n_eventos,
      tendencia_lb: { pct_cambio: null, flag: null },
      cumplimiento_ultimo_evento: buildCumplimiento(sorted[0]?.pozos)
    };
  }

  const lb = sorted[0];
  const last = sorted[n_eventos - 1];

  const lbMean = meanOfValues(
    Array.from(lb.pozos.values()).map((e) => e.valor)
  );
  const lastMean = meanOfValues(
    Array.from(last.pozos.values()).map((e) => e.valor)
  );

  const pct_cambio =
    lbMean > 0
      ? Math.round(((lastMean - lbMean) / lbMean) * 10000) / 100
      : null;

  const flag: ZVIPayload['tendencia_lb']['flag'] =
    pct_cambio !== null ? (lastMean === 0 ? 'REDUCCION_A_ND' : 'NORMAL') : null;

  return {
    n_eventos,
    tendencia_lb: { pct_cambio, flag },
    cumplimiento_ultimo_evento: buildCumplimiento(last.pozos)
  };
}

const NEGATIVE_SIGN_PARAMS = new Set(['ORP', 'OD']);

const PARAM_NAME_TO_ZVI: Record<
  ParameterName,
  ZVIPayload['correlaciones'][number]['parametro']
> = {
  ORP: 'ORP',
  OD: 'OD',
  pH: 'pH',
  CE: 'CE',
  STD: 'STD',
  Temp: 'Temperatura'
};

function buildZVIPayload(
  sustanciaId: string,
  sustanciaName: string,
  allRows: CorrelationRow[],
  grouped: Map<string, CorrelationRow[]>,
  correlations: CorrelationParameter[],
  dateFrom: string | undefined,
  dateTo: string | undefined,
  locale: string
): ZVIPayload {
  const ORPValues = grouped.get('ORP')?.map((r) => r.parameterValue) ?? [];
  const ODValues = grouped.get('OD')?.map((r) => r.parameterValue) ?? [];
  const pHValues = grouped.get('pH')?.map((r) => r.parameterValue) ?? [];

  const uniquePozos = new Set(allRows.map((r) => r.pozo));
  const sampleTimestamps = allRows.map((r) => r.sampleDate.getTime());

  const resolvedDateFrom =
    dateFrom ??
    new Date(Math.min(...sampleTimestamps)).toISOString().slice(0, 10);
  const resolvedDateTo =
    dateTo ??
    new Date(Math.max(...sampleTimestamps)).toISOString().slice(0, 10);

  const correlaciones = correlations
    .filter((c) => isParameterName(c.name) && !Number.isNaN(c.correlation))
    .map((c) => ({
      parametro: PARAM_NAME_TO_ZVI[c.name as ParameterName],
      rho: c.correlation,
      p_valor: c.pvalue,
      n: c.samples,
      signo_correcto: NEGATIVE_SIGN_PARAMS.has(c.name)
        ? c.correlation < 0
        : true
    }));

  const campaigns = buildCampaignMap(allRows);
  const { n_eventos, tendencia_lb, cumplimiento_ultimo_evento } =
    calcCampaignStats(campaigns);

  return {
    compuesto: sustanciaName || sustanciaId,
    fecha_desde: resolvedDateFrom,
    fecha_hasta: resolvedDateTo,
    n_pozos: uniquePozos.size,
    n_pares_validos: allRows.length,
    n_eventos,
    correlaciones,
    geoquimica_barrera: {
      ORP_mediana_mv: safeMedian(ORPValues),
      OD_mediana_mgl: safeMedian(ODValues),
      pH_mediana: safeMedian(pHValues),
      pct_ORP_bajo_menos100: percentBelow(ORPValues, -100),
      pct_ORP_bajo_menos200: percentBelow(ORPValues, -200),
      pct_OD_anoxic: percentBelow(ODValues, 0.5),
      pct_OD_subanoxico:
        percentBelow(ODValues, 1.0) - percentBelow(ODValues, 0.5)
    },
    tendencia_lb,
    cumplimiento_ultimo_evento,
    idioma_usuario: locale
  };
}

export const getCorrelations = authOrganizationActionClient
  .metadata({ actionName: 'getCorrelations' })
  .inputSchema(getCorrelationsSchema)
  .action(async ({ parsedInput, ctx }): Promise<CorrelationResult> => {
    const locale = await getLocale();
    const wells =
      parsedInput.wells && parsedInput.wells.length > 0
        ? parsedInput.wells.map((w) => w.toLowerCase())
        : null;

    const query = sql`
      SELECT
        f.id_pozo,
        f.fecha_muestra,
        f.campana,
        f.id_sustancia,
        ds.nombre AS nombre_sustancia,
        f.limite_deteccion,
        f.limite_cuantificacion,
        f.nivel_guia,
        f.medicion_sustancia,
        f.unidad_sustancia,
        f.fecha_parametro,
        f.parametro,
        f.medicion_parametro,
        f.unidad_parametro
      FROM dwh.fact_cruce_concentraciones_pfq f
        INNER JOIN dwh.dim_muestras dm ON f.muestra = dm.muestra
        INNER JOIN dwh.dim_sustancias ds ON f.id_sustancia = ds.id_sustancia
      WHERE dm.tipo = 'Muestreo'
        AND f.id_sustancia = ${parsedInput.substance}
        AND f.parametro != 'Profundidad al agua'
        ${wells ? sql`AND LOWER(f.id_pozo) IN ${sql.raw(`(${wells.map((w) => `'${w}'`).join(',')})`)}` : sql``}
        ${parsedInput.dateFrom ? sql`AND f.fecha_muestra >= ${parsedInput.dateFrom}::timestamp` : sql``}
        ${parsedInput.dateTo ? sql`AND f.fecha_muestra <= ${parsedInput.dateTo}::timestamp` : sql``}
    `;

    const results = await ctx.db.execute<QueryRow>(query);

    if (results.rows.length === 0) {
      return {
        substance: parsedInput.substance,
        data: [],
        matrix: {},
        loeAnalyses: []
      };
    }

    const sustanciaName =
      results.rows[0]?.nombre_sustancia ?? parsedInput.substance;
    const rows = results.rows.map(normalizeRow);
    const grouped = groupByParameter(rows);

    const correlationData = Array.from(grouped.entries()).map(
      ([name, paramRows]) => buildCorrelationParameter(name, paramRows)
    );

    const validParamNames = Array.from(grouped.keys()).filter(isParameterName);
    const paramIndex = buildParamValueIndex(grouped);
    const matrix = buildMatrix(validParamNames, paramIndex);

    const payload = buildZVIPayload(
      parsedInput.substance,
      sustanciaName,
      rows,
      grouped,
      correlationData,
      parsedInput.dateFrom,
      parsedInput.dateTo,
      locale
    );

    console.log({ payload });

    const loe = await evaluateLOE(payload);

    return {
      substance: parsedInput.substance,
      data: correlationData,
      matrix,
      loeAnalyses: [
        { status: loe.loe1.status, text: loe.loe1.texto },
        { status: loe.loe2.status, text: loe.loe2.texto },
        { status: loe.loe3.status, text: loe.loe3.texto },
        { status: loe.loe4.status, text: loe.loe4.texto }
      ]
    };
  });
