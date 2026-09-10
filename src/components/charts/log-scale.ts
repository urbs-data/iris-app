export type YScale = 'auto' | 'linear' | 'log';

const LOG_SCALE_SEPARATION = 10;

const MAX_LOG_TICKS = 8;

const roundTick = (value: number) => Number(value.toPrecision(12));

export interface LogAxis {
  domain: [number, number];
  ticks: number[];
}

function buildLogTicks(min: number, max: number): LogAxis {
  const build = (mantissas: number[]): LogAxis => {
    const candidates: number[] = [];
    const from = Math.floor(Math.log10(min));
    const to = Math.ceil(Math.log10(max));
    for (let exp = from; exp <= to; exp++) {
      for (const mantissa of mantissas) {
        candidates.push(roundTick(mantissa * 10 ** exp));
      }
    }

    const lower = [...candidates].reverse().find((t) => t <= min) ?? min;
    const upper = candidates.find((t) => t >= max) ?? max;

    return {
      domain: [lower, upper],
      ticks: candidates.filter((t) => t >= lower && t <= upper)
    };
  };

  const detailed = build([1, 2, 5]);
  return detailed.ticks.length > MAX_LOG_TICKS ? build([1]) : detailed;
}

interface ResolveLogAxisArgs {
  values: number[];
  refValues: number[];
  yScale: YScale;
}

export function resolveLogAxis({
  values,
  refValues,
  yScale
}: ResolveLogAxisArgs): LogAxis | null {
  if (yScale === 'linear') return null;

  const data = values.filter((v) => Number.isFinite(v));
  const refs = refValues.filter((v) => Number.isFinite(v));
  if (data.length === 0 || refs.length === 0) return null;

  if ([...data, ...refs].some((v) => v <= 0)) return null;

  const dataMin = Math.min(...data);
  const dataMax = Math.max(...data);
  const refMin = Math.min(...refs);
  const refMax = Math.max(...refs);

  const separation = Math.max(refMax / dataMax, dataMin / refMin);
  if (yScale === 'auto' && separation < LOG_SCALE_SEPARATION) return null;

  return buildLogTicks(Math.min(dataMin, refMin), Math.max(dataMax, refMax));
}

export function formatLogTick(value: number, locale: string) {
  return value >= 0.001 && value < 1_000_000
    ? value.toLocaleString(locale, { maximumSignificantDigits: 3 })
    : value.toExponential(0);
}
