'use client';

import * as React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Scatter,
  ZAxis,
  ErrorBar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoButton } from '@/components/ui/info-button';
import { InfobarContent } from '../ui/infobar';

interface BoxplotDataPoint {
  period: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean?: number;
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

const chartConfig: ChartConfig = {
  boxplot: {
    label: 'Distribución',
    color: 'var(--primary)'
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
  // Transform data for the boxplot visualization
  const transformedData = data.map((item) => ({
    ...item,
    // For the IQR box (q1 to q3)
    boxStart: item.q1,
    boxHeight: item.q3 - item.q1,
    // For whiskers
    lowerWhisker: item.min,
    upperWhisker: item.max,
    // Position for median line
    medianValue: item.median
  }));

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
              <div className='bg-primary/30 border-primary h-3 w-4 border' />
              <span>Rango intercuartil</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='bg-foreground h-2 w-2 rounded-full' />
              <span>Promedio</span>
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
          <ComposedChart
            data={transformedData}
            margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
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
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const data = item.payload;
                    return (
                      <div className='flex flex-col gap-1 text-xs'>
                        <div>Máx: {data.max?.toFixed(2)}</div>
                        <div>Q3: {data.q3?.toFixed(2)}</div>
                        <div>Mediana: {data.median?.toFixed(2)}</div>
                        <div>Q1: {data.q1?.toFixed(2)}</div>
                        <div>Mín: {data.min?.toFixed(2)}</div>
                        {data.mean && (
                          <div>Promedio: {data.mean?.toFixed(2)}</div>
                        )}
                      </div>
                    );
                  }}
                />
              }
            />
            {referenceLines.map((ref, index) => (
              <ReferenceLine
                key={index}
                y={ref.value}
                stroke={ref.color || 'var(--destructive)'}
                strokeDasharray={ref.strokeDasharray || '5 5'}
                strokeWidth={1.5}
              />
            ))}
            {/* IQR Box */}
            <Bar dataKey='boxHeight' stackId='box' fill='transparent'>
              {transformedData.map((entry, index) => (
                <Cell key={index} />
              ))}
            </Bar>
            <Bar
              dataKey='boxHeight'
              stackId='box2'
              fill='hsl(var(--primary) / 0.3)'
              stroke='hsl(var(--primary))'
              strokeWidth={1}
              radius={[2, 2, 2, 2]}
            >
              {transformedData.map((entry, index) => (
                <Cell key={index} y={entry.boxStart} />
              ))}
            </Bar>
            {/* Mean points */}
            <Scatter
              dataKey='mean'
              fill='hsl(var(--foreground))'
              shape='circle'
            >
              <ZAxis range={[30, 30]} />
            </Scatter>
          </ComposedChart>
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
