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
import * as jStat from 'jstat';
import * as ss from 'simple-statistics';
import { evaluateLOE, type ZVIPayload } from './evaluate-loe';
import { getLocale } from 'next-intl/server';

interface QueryRow extends Record<string, unknown> {
  pozo: string;
  fecha_muestra: Date;
  id_sustancia: string;
  sustancia: string;
  medicion_sustancia: number;
  unidad_sustancia: string;
  fecha_parametro: Date;
  parametro: string;
  medicion_parametro: number;
  unidad_parametro: string;
}

function rankArray(arr: number[]): number[] {
  const sorted = [...arr].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(arr.length);
  sorted.forEach(({ i }, rank) => {
    ranks[i] = rank + 1;
  });
  return ranks;
}

function spearman(
  x: number[],
  y: number[]
): { rho: number; p_valor: number; n: number } {
  const n = x.length;
  if (n < 6) return { rho: NaN, p_valor: NaN, n };

  const rho = ss.sampleCorrelation(rankArray(x), rankArray(y));
  const df = n - 2;
  const t = rho * Math.sqrt(df / (1 - rho ** 2));
  const p_valor = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));

  return { rho, p_valor, n };
}

function normalizeRow(row: QueryRow): CorrelationRow {
  return {
    pozo: row.pozo,
    sampleDate: new Date(row.fecha_muestra),
    substanceValue: row.medicion_sustancia,
    substanceUnit: row.unidad_sustancia,
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

function safeMedian(values: number[]): number {
  return values.length > 0 ? ss.median(values) : 0;
}

function percentBelow(values: number[], threshold: number): number {
  if (values.length === 0) return 0;
  return (values.filter((v) => v < threshold).length / values.length) * 100;
}

function buildZVIPayload(
  substance: string,
  allRows: CorrelationRow[],
  grouped: Map<string, CorrelationRow[]>,
  correlations: CorrelationParameter[],
  dateFrom: string | undefined,
  dateTo: string | undefined,
  locale: string
): ZVIPayload {
  const ORPValues = grouped.get('ORP')?.map((r) => r.parameterValue) ?? [];
  const ODValues = grouped.get('OD')?.map((r) => r.parameterValue) ?? [];
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

  return {
    compuesto: substance,
    fecha_desde: resolvedDateFrom,
    fecha_hasta: resolvedDateTo,
    n_pozos: uniquePozos.size,
    n_pares_validos: allRows.length,
    correlaciones,
    geoquimica_barrera: {
      ORP_mediana_mv: safeMedian(ORPValues),
      OD_mediana_mgl: safeMedian(ODValues),
      pct_ORP_bajo_menos100: percentBelow(ORPValues, -100),
      pct_OD_anoxic: percentBelow(ODValues, 1)
    },
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
      select *
      from fact_cruce_concentraciones_parametros
      where id_sustancia = ${parsedInput.substance}
        AND parametro != 'Profundidad al agua'
        ${wells ? sql`AND LOWER(pozo) IN ${sql.raw(`(${wells.map((w) => `'${w}'`).join(',')})`)}` : sql``}
        ${parsedInput.dateFrom ? sql`AND fecha_muestra >= ${parsedInput.dateFrom}::timestamp` : sql``}
        ${parsedInput.dateTo ? sql`AND fecha_muestra <= ${parsedInput.dateTo}::timestamp` : sql``}
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
      rows,
      grouped,
      correlationData,
      parsedInput.dateFrom,
      parsedInput.dateTo,
      locale
    );

    const loe = await evaluateLOE(payload);

    return {
      substance: parsedInput.substance,
      data: correlationData,
      matrix,
      loeAnalyses: [
        { status: loe.loe1.status, text: loe.loe1.texto },
        { status: loe.loe2.status, text: loe.loe2.texto },
        { status: loe.loe3.status, text: loe.loe3.texto }
      ]
    };
  });
