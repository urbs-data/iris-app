import { KpiCard } from '@/components/charts';
import { getGeneralMetrics } from '@/features/substance/data/get-general-metrics';
import {
  substanceSearchParamsCache,
  serializeSubstanceParams
} from '@/features/substance/searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function KpisContent() {
  const dateFrom = substanceSearchParamsCache.get('dateFrom');
  const dateTo = substanceSearchParamsCache.get('dateTo');
  const substance = substanceSearchParamsCache.get('substance');
  const wellType = substanceSearchParamsCache.get('wellType');
  const area = substanceSearchParamsCache.get('area');
  const well = substanceSearchParamsCache.get('well');
  const sampleType = substanceSearchParamsCache.get('sampleType');

  const filters = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(substance && { substance }),
    wellType,
    ...(area && { area }),
    ...(well && { well }),
    sampleType
  };

  const metrics = await resolveActionResult(getGeneralMetrics(filters));

  const mainKpis = [
    { label: 'Muestras', value: metrics.samples },
    { label: 'Promedio', value: metrics.average.toFixed(1), unit: 'µg/l' },
    { label: 'Mediana', value: metrics.median.toFixed(2), unit: 'µg/l' },
    { label: 'Mínimo', value: metrics.min.toFixed(2), unit: 'µg/l' },
    { label: 'Máximo', value: metrics.max.toFixed(2), unit: 'µg/l' },
    { label: 'Desvío', value: metrics.stdDev.toFixed(2), unit: 'µg/l' }
  ];

  const guideKpis = [
    { label: 'Nivel Guía', value: metrics.guideLevel, unit: 'µg/l' },
    {
      label: '% vs Guía',
      value: `${metrics.vsGuidePercent.toFixed(2)} %`,
      className: metrics.vsGuidePercent > 100 ? 'text-destructive' : ''
    },
    {
      label: '% vs Máx',
      value: `${metrics.vsMaxPercent.toFixed(2)} %`,
      className: metrics.vsMaxPercent < 0 ? 'text-green-600' : ''
    }
  ];

  return (
    <div className='grid grid-cols-1 gap-2 md:grid-cols-3'>
      <KpiCard items={mainKpis} className='md:col-span-2' />
      <KpiCard items={guideKpis} />
    </div>
  );
}

export default async function KpisPage(props: PageProps) {
  const searchParams = await props.searchParams;
  substanceSearchParamsCache.parse(searchParams);

  const key = serializeSubstanceParams({ ...searchParams });

  return (
    <Suspense
      key={key}
      fallback={
        <div className='grid grid-cols-1 gap-2 md:grid-cols-3'>
          <Skeleton className='h-26 md:col-span-2' />
          <Skeleton className='h-26' />
        </div>
      }
    >
      <KpisContent />
    </Suspense>
  );
}
