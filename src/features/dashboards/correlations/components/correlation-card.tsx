'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CorrelationParameter } from '../types';

interface CorrelationCardProps {
  parameter: CorrelationParameter;
}

function getRhoVariant(rho: number): {
  className: string;
  labelKey: string;
} {
  if (Number.isNaN(rho))
    return { className: 'text-muted-foreground', labelKey: 'rhoNa' };
  if (rho <= -0.7)
    return {
      className: 'text-green-600 dark:text-green-400',
      labelKey: 'rhoStrongNeg'
    };
  if (rho <= -0.4)
    return {
      className: 'text-blue-600 dark:text-blue-400',
      labelKey: 'rhoModNeg'
    };
  if (rho < 0)
    return { className: 'text-muted-foreground', labelKey: 'rhoWeakNeg' };
  if (rho >= 0.7)
    return { className: 'text-destructive', labelKey: 'rhoStrongPos' };
  if (rho >= 0.4)
    return {
      className: 'text-amber-600 dark:text-amber-400',
      labelKey: 'rhoModPos'
    };
  return { className: 'text-muted-foreground', labelKey: 'rhoWeakPos' };
}

function formatPValue(p: number): string {
  if (Number.isNaN(p)) return '—';
  if (p < 0.001) return 'p < 0.001';
  if (p < 0.01) return `p < 0.01`;
  if (p < 0.05) return `p < 0.05`;
  return `p = ${p.toFixed(2)}`;
}

export function CorrelationCard({ parameter }: CorrelationCardProps) {
  const t = useTranslations('dashboard.correlations');
  const { name, unit, correlation, pvalue, samples, data } = parameter;
  const rhoVariant = getRhoVariant(correlation);
  const isSignificant = !Number.isNaN(pvalue) && pvalue < 0.05;

  const scatterData = useMemo(
    () =>
      data.map((row) => ({
        x: row.substanceValue,
        y: row.parameterValue
      })),
    [data]
  );

  const yMid = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, r) => acc + r.parameterValue, 0);
    return sum / data.length;
  }, [data]);

  return (
    <div className='bg-card flex flex-col gap-2 rounded-xl border p-4'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          <span className='text-base leading-tight font-semibold'>{name}</span>
          {unit ? (
            <span className='text-muted-foreground ml-1 text-sm'>({unit})</span>
          ) : null}
        </div>
        <span
          className={cn(
            'text-2xl leading-none font-bold tabular-nums',
            rhoVariant.className
          )}
        >
          {Number.isNaN(correlation)
            ? '—'
            : `${correlation >= 0 ? '+' : ''}${correlation.toFixed(2)}`}
        </span>
      </div>

      <div className='h-16 w-full'>
        {scatterData.length > 0 ? (
          <ResponsiveContainer width='100%' height='100%' debounce={2000}>
            <ScatterChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <XAxis dataKey='x' type='number' hide />
              <YAxis dataKey='y' type='number' hide />
              <ReferenceLine
                y={yMid}
                stroke='hsl(var(--border))'
                strokeDasharray='4 4'
                strokeWidth={1}
              />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const pt = payload[0]?.payload as { x: number; y: number };
                  return (
                    <div className='bg-popover rounded-md border px-2 py-1.5 text-sm shadow-md'>
                      <span className='text-muted-foreground'>{name}:</span>{' '}
                      <span className='font-medium'>{pt.y}</span>
                      <br />
                      <span className='text-muted-foreground'>
                        Sustancia:
                      </span>{' '}
                      <span className='font-medium'>{pt.x}</span>
                    </div>
                  );
                }}
              />
              <Scatter
                data={scatterData}
                fill='hsl(var(--primary))'
                opacity={0.55}
                shape={({ cx, cy }: { cx?: number; cy?: number }) => (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill='hsl(var(--primary))'
                    fillOpacity={0.55}
                  />
                )}
              />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className='flex h-full items-center justify-center'>
            <span className='text-muted-foreground text-sm'>
              {t('noDataLabel')}
            </span>
          </div>
        )}
      </div>

      <div className='flex flex-col gap-1'>
        <div className='text-muted-foreground flex items-center gap-1.5 text-sm'>
          <Badge
            variant={isSignificant ? 'default' : 'secondary'}
            className='h-5 px-2 text-xs'
          >
            {isSignificant ? t('sig') : t('ns')}
          </Badge>
          {formatPValue(pvalue)}
          <span>·</span>
          <span>n = {samples}</span>
        </div>
      </div>
    </div>
  );
}
