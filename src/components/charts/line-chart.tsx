'use client';

import * as React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine as RechartsReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface DataPoint {
  date: Date;
  value: number;
}

interface ReferenceLine {
  value: number;
  label: string;
  color?: string;
  strokeDasharray?: string;
}

interface LineChartProps {
  title?: string;
  data: DataPoint[];
  dataKey?: string;
  xAxisKey?: string;
  referenceLines?: ReferenceLine[];
  className?: string;
  yAxisLabel?: string;
  chartConfig?: ChartConfig;
  formatXAxis?: (value: string) => string;
  tooltipLabel?: string;
  tooltipUnit?: string;
  locale?: string;
}

const defaultChartConfig: ChartConfig = {
  value: {
    label: 'Concentración',
    color: 'var(--primary)'
  }
};

export function LineChart({
  title,
  data,
  dataKey = 'value',
  xAxisKey = 'date',
  referenceLines = [],
  className,
  yAxisLabel,
  chartConfig = defaultChartConfig,
  formatXAxis,
  tooltipLabel = 'Valor',
  tooltipUnit = '',
  locale = 'es-AR'
}: LineChartProps) {
  const transformedData = React.useMemo(() => {
    return data.map((point: DataPoint) => ({
      ...point,
      timestamp: point.date.getTime()
    }));
  }, [data, xAxisKey]);

  const defaultFormatXAxis = (value: number) => {
    const date = new Date(value);
    return date.toLocaleDateString('es-AR', {
      month: 'short',
      year: '2-digit'
    });
  };

  const formatXAxisWrapper = (value: number) => {
    if (formatXAxis) {
      const dateStr = new Date(value).toISOString();
      return formatXAxis(dateStr);
    }
    return defaultFormatXAxis(value);
  };

  return (
    <Card
      className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}
    >
      {title && (
        <CardHeader className='shrink-0 pb-2'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          <div className='text-muted-foreground flex items-center gap-4 text-xs'>
            <div className='flex items-center gap-1'>
              <div className='bg-primary h-0.5 w-4' />
              <span>Concentración</span>
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
      <CardContent className='min-h-0 flex-1 overflow-hidden p-2'>
        <ChartContainer config={chartConfig} className='h-full w-full'>
          <RechartsLineChart
            data={transformedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis
              dataKey='timestamp'
              type='number'
              domain={['dataMin', 'dataMax']}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatXAxisWrapper}
              tick={{ fontSize: 10 }}
              scale='time'
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
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;

                const dataPoint = payload[0].payload;
                const fecha = new Date(dataPoint.timestamp).toLocaleDateString(
                  locale,
                  {
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC'
                  }
                );

                const value = dataPoint[dataKey];

                return (
                  <div className='bg-background rounded-lg border p-2 shadow-sm'>
                    <p className='text-sm font-medium'>{fecha}</p>
                    <div className='mt-1 text-sm'>
                      <p>
                        {tooltipLabel}:{' '}
                        {typeof value === 'number' ? value.toFixed(2) : value}{' '}
                        {tooltipUnit}
                      </p>
                    </div>
                  </div>
                );
              }}
            />
            {referenceLines.map((ref, index) => (
              <RechartsReferenceLine
                key={index}
                y={ref.value}
                stroke={ref.color || 'var(--destructive)'}
                strokeDasharray={ref.strokeDasharray || '5 5'}
                strokeWidth={1.5}
              />
            ))}
            <Line
              type='monotone'
              dataKey={dataKey}
              stroke='var(--primary)'
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--primary)' }}
              activeDot={{ r: 5 }}
            />
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface LineChartSkeletonProps {
  className?: string;
  showTitle?: boolean;
}

export function LineChartSkeleton({
  className,
  showTitle = true
}: LineChartSkeletonProps) {
  return (
    <Card className={cn('flex h-full flex-col', className)}>
      {showTitle && (
        <CardHeader className='pb-2'>
          <Skeleton className='h-4 w-48' />
          <div className='flex gap-4'>
            <Skeleton className='h-3 w-24' />
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
