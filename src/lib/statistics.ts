import * as ss from 'simple-statistics';
import * as jStat from 'jstat';

export function safeMedian(values: number[]): number {
  return values.length > 0 ? ss.median(values) : 0;
}

export function percentBelow(values: number[], threshold: number): number {
  if (values.length === 0) return 0;
  return (values.filter((v) => v < threshold).length / values.length) * 100;
}

function rankArray(arr: number[]): number[] {
  const sorted = [...arr].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(arr.length);
  sorted.forEach(({ i }, rank) => {
    ranks[i] = rank + 1;
  });
  return ranks;
}

export function spearman(
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

export function meanOfValues(vals: number[]): number {
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
