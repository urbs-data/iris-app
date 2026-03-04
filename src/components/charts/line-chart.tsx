'use client';

import * as React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ReferenceLine as RechartsReferenceLine,
  XAxis,
  YAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface SeriesConfig {
  dataKey: string;
  label: string;
  unit: string;
  color: string;
  yAxisId?: 'left' | 'right';
  yAxisLabel?: string;
}

interface ReferenceLine {
  value: number;
  label: string;
  color?: string;
  strokeDasharray?: string;
}

type TimeMode = 'monthly' | 'daily';

interface LineChartProps {
  title?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKey?: string;
  referenceLines?: ReferenceLine[];
  className?: string;
  yAxisLabel?: string;
  tooltipLabel?: string;
  tooltipUnit?: string;
  locale?: string;
  series?: SeriesConfig[];
  timeMode?: TimeMode;
}

export function LineChart({
  title,
  data,
  dataKey = 'value',
  referenceLines = [],
  className,
  yAxisLabel,
  tooltipLabel = 'Valor',
  tooltipUnit = '',
  locale = 'es-AR',
  series,
  timeMode = 'monthly'
}: LineChartProps) {
  const isMultiSeries = !!series && series.length > 0;

  const chartConfig = React.useMemo<ChartConfig>(() => {
    if (isMultiSeries) {
      const config: ChartConfig = {};
      for (const s of series!) {
        config[s.dataKey] = {
          label: s.unit ? `${s.label} [${s.unit}]` : s.label,
          color: s.color
        };
      }
      return config;
    }
    return {
      [dataKey]: {
        label: tooltipUnit ? `${tooltipLabel} [${tooltipUnit}]` : tooltipLabel,
        color: 'var(--primary)'
      }
    };
  }, [isMultiSeries, series, dataKey, tooltipLabel, tooltipUnit]);

  const normalizedData = React.useMemo(
    () =>
      data.map((point) => ({
        ...point,
        // Usamos siempre un timestamp numérico en el eje X
        // para que la escala temporal respete las distancias reales.
        date:
          point.date instanceof Date
            ? point.date.getTime()
            : typeof point.date === 'string'
              ? Date.parse(point.date)
              : point.date
      })),
    [data]
  );

  const hasRightAxis =
    isMultiSeries && series!.some((s) => s.yAxisId === 'right');

  const leftSeries = isMultiSeries
    ? series!.find((s) => !s.yAxisId || s.yAxisId === 'left')
    : undefined;
  const rightSeries = isMultiSeries
    ? series!.find((s) => s.yAxisId === 'right')
    : undefined;

  const leftAxisLabel = isMultiSeries ? leftSeries?.yAxisLabel : yAxisLabel;
  const rightAxisLabel = rightSeries?.yAxisLabel;

  const leftAxisColor = leftSeries?.color ?? 'currentColor';
  const rightAxisColor = rightSeries?.color ?? 'currentColor';

  const formatTick = (rawValue: number | string) => {
    const value = typeof rawValue === 'string' ? Number(rawValue) : rawValue;
    if (!Number.isFinite(value)) return '';

    const date = new Date(value);
    if (timeMode === 'daily') {
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      });
    }
    return date.toLocaleDateString(locale, {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC'
    });
  };

  const formatTooltipLabel = (
    _value: unknown,
    payload?: { payload?: { date?: number } }[]
  ) => {
    const dateValue = payload?.[0]?.payload?.date;
    const date = new Date(Number(dateValue));
    if (isNaN(date.getTime()))
      return dateValue != null ? String(dateValue) : '';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <Card
      className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}
    >
      {title && (
        <CardHeader className='shrink-0 pb-2'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          <div className='flex flex-wrap items-center gap-x-4 gap-y-1'>
            {isMultiSeries ? (
              series!.map((s) => (
                <div key={s.dataKey} className='flex items-center gap-1.5'>
                  <div
                    className='h-0.5 w-4 shrink-0 rounded-full'
                    style={{ backgroundColor: s.color }}
                  />
                  <span className='text-muted-foreground text-xs'>
                    {s.unit ? `${s.label} [${s.unit}]` : s.label}
                  </span>
                </div>
              ))
            ) : (
              <div className='flex items-center gap-1.5'>
                <div className='bg-primary h-0.5 w-4 shrink-0 rounded-full' />
                <span className='text-muted-foreground text-xs'>
                  {tooltipUnit
                    ? `${tooltipLabel} [${tooltipUnit}]`
                    : tooltipLabel}
                </span>
              </div>
            )}
            {referenceLines.map((ref, index) => (
              <div key={`ref-${index}`} className='flex items-center gap-1.5'>
                <div
                  className='h-0.5 w-4 shrink-0'
                  style={{
                    backgroundColor: ref.color ?? 'var(--destructive)',
                    borderTop: `1.5px dashed ${ref.color ?? 'var(--destructive)'}`
                  }}
                />
                <span className='text-muted-foreground text-xs'>
                  {ref.label}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>
      )}
      <CardContent className='min-h-0 flex-1 p-2'>
        <ChartContainer config={chartConfig} className='h-full w-full'>
          <RechartsLineChart
            accessibilityLayer
            data={normalizedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              type='number'
              scale='time'
              domain={['auto', 'auto']}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fontSize: 10 }}
              tickFormatter={formatTick}
            />
            <YAxis
              yAxisId='left'
              orientation='left'
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={leftAxisLabel ? 65 : 50}
              tick={{
                fontSize: 10,
                fill: isMultiSeries ? leftAxisColor : 'currentColor'
              }}
              label={
                leftAxisLabel
                  ? {
                      value: leftAxisLabel,
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      style: {
                        textAnchor: 'middle',
                        fontSize: 13,
                        fill: isMultiSeries ? leftAxisColor : 'currentColor'
                      }
                    }
                  : undefined
              }
            />
            {hasRightAxis && (
              <YAxis
                yAxisId='right'
                orientation='right'
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={rightAxisLabel ? 65 : 50}
                tick={{ fontSize: 10, fill: rightAxisColor }}
                label={
                  rightAxisLabel
                    ? {
                        value: rightAxisLabel,
                        angle: 90,
                        position: 'insideRight',
                        offset: 10,
                        style: {
                          textAnchor: 'middle',
                          fontSize: 13,
                          fill: rightAxisColor
                        }
                      }
                    : undefined
                }
              />
            )}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelKey='date'
                  labelFormatter={formatTooltipLabel}
                />
              }
            />
            {referenceLines.map((ref, index) => (
              <RechartsReferenceLine
                key={index}
                y={ref.value}
                yAxisId='left'
                stroke={ref.color ?? 'var(--destructive)'}
                strokeDasharray={ref.strokeDasharray ?? '5 5'}
                strokeWidth={1.5}
              />
            ))}
            {isMultiSeries ? (
              series!.map((s) => (
                <Line
                  key={s.dataKey}
                  dataKey={s.dataKey}
                  type='monotone'
                  stroke={`var(--color-${s.dataKey})`}
                  strokeWidth={2}
                  dot={{ r: 2, fill: `var(--color-${s.dataKey})` }}
                  activeDot={{ r: 4 }}
                  yAxisId={s.yAxisId ?? 'left'}
                  connectNulls
                />
              ))
            ) : (
              <Line
                dataKey={dataKey}
                type='monotone'
                stroke={`var(--color-${dataKey})`}
                strokeWidth={2}
                dot={{ r: 2, fill: `var(--color-${dataKey})` }}
                activeDot={{ r: 4 }}
                yAxisId='left'
              />
            )}
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface LineChartSkeletonProps {
  className?: string;
}

export function LineChartSkeleton({ className }: LineChartSkeletonProps) {
  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className='pb-2'>
        <Skeleton className='h-4 w-48' />
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center p-2'>
        <Skeleton className='h-full w-full' />
      </CardContent>
    </Card>
  );
}
