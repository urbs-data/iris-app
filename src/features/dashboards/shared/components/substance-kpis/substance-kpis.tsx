'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Map } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type {
  GeneralMetrics,
  WellMetrics
} from '@/features/dashboards/substance/types';

interface SubstanceKpisProps {
  title: string;
  generalMetrics: GeneralMetrics;
  wellMetrics: WellMetrics[];
  unit?: string;
  onViewMap?: () => void;
  className?: string;
}

export function SubstanceKpis({
  title,
  generalMetrics,
  wellMetrics,
  unit,
  onViewMap,
  className
}: SubstanceKpisProps) {
  const t = useTranslations('dashboard');
  const sortedWellMetrics = [...wellMetrics].sort((a, b) => b.mean - a.mean);

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-base font-semibold'>KPIs {title}</CardTitle>
        <Button
          variant='outline'
          size='sm'
          onClick={onViewMap}
          disabled={!onViewMap}
          className='h-8 gap-1.5 text-xs'
        >
          <Map className='h-3.5 w-3.5' />
          {t('map.viewInMap')}
        </Button>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4 overflow-hidden pt-0'>
        <div className='grid shrink-0 grid-cols-5 divide-x'>
          <MetricItem
            label={t('kpi.sampleCount')}
            value={generalMetrics.samples}
          />
          <MetricItem
            label={t('kpi.guidelineLevel')}
            value={generalMetrics.guideLevel}
            unit={unit}
          />
          <MetricItem
            label={t('kpi.average')}
            value={generalMetrics.average.toFixed(1)}
            unit={unit}
            valueClassName={
              generalMetrics.average > generalMetrics.guideLevel
                ? 'text-destructive'
                : 'text-green-600'
            }
          />
          <MetricItem
            label={t('kpi.minimum')}
            value={generalMetrics.min.toFixed(2)}
            unit={unit}
            valueClassName='text-green-600'
          />
          <MetricItem
            label={t('kpi.maximum')}
            value={generalMetrics.max.toFixed(2)}
            unit={unit}
            valueClassName={
              generalMetrics.max > generalMetrics.guideLevel
                ? 'text-destructive'
                : ''
            }
          />
        </div>

        <div className='min-h-0 flex-1 overflow-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-muted sticky top-0'>
              <tr className='border-b'>
                <th className='px-2 py-1.5 text-left font-medium'>
                  {t('kpi.well')}
                </th>
                <th className='px-2 py-1.5 text-right font-medium'>
                  {t('kpi.average')}
                </th>
                <th className='px-2 py-1.5 text-center font-medium'>
                  {t('kpi.firstSample')}
                </th>
                <th className='px-2 py-1.5 text-center font-medium'>
                  {t('kpi.lastSample')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedWellMetrics.map((well) => (
                <tr key={well.wellId} className='border-b last:border-b-0'>
                  <td className='px-2 py-1.5 font-medium'>{well.wellId}</td>
                  <td
                    className={cn(
                      'px-2 py-1.5 text-right tabular-nums',
                      well.mean > generalMetrics.guideLevel
                        ? 'text-destructive font-semibold'
                        : ''
                    )}
                  >
                    {well.mean.toFixed(2)} {unit}
                  </td>
                  <td className='text-muted-foreground px-2 py-1.5 text-center'>
                    {well.firstPeriod}
                  </td>
                  <td className='text-muted-foreground px-2 py-1.5 text-center'>
                    {well.lastPeriod}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricItemProps {
  label: string;
  value: string | number;
  unit?: string;
  valueClassName?: string;
}

function MetricItem({ label, value, unit, valueClassName }: MetricItemProps) {
  return (
    <div className='flex flex-col items-center text-center'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <span className={cn('text-lg font-bold tabular-nums', valueClassName)}>
        {value}
        {unit && (
          <span className='text-muted-foreground ml-0.5 text-xs font-normal'>
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

interface SubstanceKpisSkeletonProps {
  className?: string;
}

export function SubstanceKpisSkeleton({
  className
}: SubstanceKpisSkeletonProps) {
  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <Skeleton className='h-5 w-40' />
        <Skeleton className='h-8 w-24' />
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4 overflow-hidden pt-0'>
        <div className='grid shrink-0 grid-cols-5 gap-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex flex-col items-center gap-1'>
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-6 w-16' />
            </div>
          ))}
        </div>
        <div className='flex-1 space-y-2'>
          <Skeleton className='h-8 w-full' />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-8 w-full' />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
