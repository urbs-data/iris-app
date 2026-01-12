'use client';

import * as React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Scatter,
  RectangleProps,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoButton } from '@/components/ui/info-button';
import { InfobarContent } from '../ui/infobar';
import { useTranslations } from 'next-intl';

interface BoxplotDataPoint {
  period: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean?: number;
  unit: string;
}

interface ReferenceLineConfig {
  value: number;
  label: string;
  color?: string;
  strokeDasharray?: string;
}

interface BoxplotChartProps {
  title?: string;
  infoTooltip?: InfobarContent;
  data: BoxplotDataPoint[];
  referenceLines?: ReferenceLineConfig[];
  className?: string;
  yAxisLabel?: string;
}

// Componente para renderizar las líneas verticales de los whiskers
const VerticalLine = (props: RectangleProps) => {
  const { x, y, width, height } = props;

  if (x == null || y == null || width == null || height == null) {
    return null;
  }

  return (
    <line
      x1={x + width / 2}
      y1={y + height}
      x2={x + width / 2}
      y2={y}
      stroke='var(--foreground)'
      strokeWidth={2}
    />
  );
};

// Componente para renderizar las líneas horizontales (caps de whiskers y mediana)
const HorizontalLine = (props: RectangleProps) => {
  const { x, y, width } = props;

  if (x == null || y == null || width == null) {
    return null;
  }

  return (
    <line
      x1={x}
      y1={y}
      x2={x + width}
      y2={y}
      stroke='var(--foreground)'
      strokeWidth={2.5}
    />
  );
};

type TransformedBoxplotData = BoxplotDataPoint & {
  bottomWhisker: number;
  bottomBox: number;
  topBox: number;
  topWhisker: number;
};

const chartConfig: ChartConfig = {
  boxplot: {
    label: 'Distribución',
    color: 'var(--primary)'
  },
  whisker: {
    label: 'Rango de valores',
    color: 'var(--foreground)'
  },
  average: {
    label: 'Promedio',
    color: 'var(--foreground)'
  }
};

export function BoxplotChart({
  title,
  infoTooltip,
  data,
  referenceLines = [],
  className,
  yAxisLabel
}: BoxplotChartProps) {
  const t = useTranslations('dashboard.boxplot');
  const tKpi = useTranslations('dashboard.kpi');

  // Transform data for the boxplot visualization with proper stacking
  const transformedData: TransformedBoxplotData[] = React.useMemo(
    () =>
      data.map((item) => {
        const iqr = item.q3 - item.q1;
        const lowerLimit = item.q1 - 1.5 * iqr;
        const upperLimit = item.q3 + 1.5 * iqr;

        // Ajustar min y max según los límites del IQR
        const minValue = Math.max(Math.min(item.min, lowerLimit), 0);
        const maxValue = Math.min(item.max, upperLimit);

        return {
          ...item,
          bottomWhisker: item.q1 - minValue,
          bottomBox: item.median - item.q1,
          topBox: item.q3 - item.median,
          topWhisker: maxValue - item.q3
        };
      }),
    [data]
  );

  return (
    <Card className={cn('flex h-full min-h-0 flex-col', className)}>
      {title && (
        <CardHeader className='shrink-0 pb-2'>
          <div className='flex items-center gap-2'>
            <CardTitle className='text-sm font-medium'>{title}</CardTitle>
            {infoTooltip && <InfoButton content={infoTooltip} />}
          </div>
          <div className='text-muted-foreground flex flex-wrap items-center gap-4 text-xs'>
            <div className='flex items-center gap-1'>
              <div className='bg-primary h-3 w-4' />
              <span>{t('interquartileRange')}</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='bg-foreground h-2 w-2 rounded-full' />
              <span>{t('average')}</span>
            </div>
            {referenceLines.map((ref, index) => (
              <div key={index} className='flex items-center gap-1'>
                <div
                  className='h-0.5 w-4'
                  style={{
                    backgroundColor: ref.color || 'var(--destructive)',
                    borderStyle: ref.strokeDasharray ? 'dashed' : 'solid'
                  }}
                />
                <span>{ref.label}</span>
              </div>
            ))}
          </div>
        </CardHeader>
      )}
      <CardContent className='min-h-0 flex-1 p-2'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-full w-full'
        >
          <ResponsiveContainer width='100%' height='100%'>
            <ComposedChart
              data={transformedData}
              margin={{ top: 5, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                vertical={false}
                className='stroke-border/50'
              />
              <XAxis
                dataKey='period'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10 }}
                label={
                  yAxisLabel
                    ? {
                        value: yAxisLabel,
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 10 }
                      }
                    : undefined
                }
              />
              <ChartTooltip
                wrapperStyle={{ outline: 'none' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;

                  const data = payload[0].payload as BoxplotDataPoint;

                  return (
                    <div className='bg-background rounded-lg border p-2 shadow-sm'>
                      <p className='text-sm font-medium'>{data.period}</p>
                      <div className='mt-1 space-y-1 text-sm'>
                        <p>
                          {tKpi('minimum')}: {data.min?.toFixed(2)} {data.unit}
                        </p>
                        <p>
                          Q1: {data.q1?.toFixed(2)} {data.unit}
                        </p>
                        <p>
                          {tKpi('median')}: {data.median?.toFixed(2)}{' '}
                          {data.unit}
                        </p>
                        {data.mean != null && (
                          <p>
                            {tKpi('average')}: {data.mean?.toFixed(2)}{' '}
                            {data.unit}
                          </p>
                        )}
                        <p>
                          Q3: {data.q3?.toFixed(2)} {data.unit}
                        </p>
                        <p>
                          {tKpi('maximum')}: {data.max?.toFixed(2)} {data.unit}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              {referenceLines.map((ref, index) => (
                <ReferenceLine
                  key={index}
                  y={ref.value}
                  stroke={ref.color || 'var(--destructive)'}
                  strokeDasharray={ref.strokeDasharray || '10 10'}
                  strokeWidth={2}
                />
              ))}
              {/* Stack de barras para crear el boxplot */}
              {/* Barra invisible para el offset desde 0 hasta min */}
              <Bar stackId='a' dataKey='min' fill='none' />
              {/* Cap inferior del whisker */}
              <Bar stackId='a' dataKey='bar' shape={<HorizontalLine />} />
              {/* Línea del whisker inferior */}
              <Bar
                stackId='a'
                dataKey='bottomWhisker'
                shape={<VerticalLine />}
              />
              {/* Caja inferior (Q1 a mediana) */}
              <Bar stackId='a' dataKey='bottomBox' fill='var(--primary)' />
              {/* Línea de la mediana */}
              <Bar stackId='a' dataKey='bar' shape={<HorizontalLine />} />
              {/* Caja superior (mediana a Q3) */}
              <Bar stackId='a' dataKey='topBox' fill='var(--primary)' />
              {/* Línea del whisker superior */}
              <Bar stackId='a' dataKey='topWhisker' shape={<VerticalLine />} />
              {/* Cap superior del whisker */}
              <Bar stackId='a' dataKey='bar' shape={<HorizontalLine />} />
              {/* Puntos del promedio */}
              {data.some((d) => d.mean != null) && (
                <Scatter
                  dataKey='mean'
                  fill='var(--foreground)'
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    return (
                      <circle cx={cx} cy={cy} r={4} fill='var(--foreground)' />
                    );
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface BoxplotSkeletonProps {
  className?: string;
  showTitle?: boolean;
}

export function BoxplotSkeleton({
  className,
  showTitle = true
}: BoxplotSkeletonProps) {
  return (
    <Card className={cn('flex h-full flex-col', className)}>
      {showTitle && (
        <CardHeader className='pb-2'>
          <Skeleton className='h-4 w-48' />
          <div className='flex gap-4'>
            <Skeleton className='h-3 w-28' />
            <Skeleton className='h-3 w-20' />
          </div>
        </CardHeader>
      )}
      <CardContent className='flex flex-1 items-center justify-center p-2'>
        <Skeleton className='h-full w-full' />
      </CardContent>
    </Card>
  );
}
