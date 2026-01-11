import { BoxplotChart } from '@/components/charts';
import { getQuarterlyMetrics } from '@/features/substance/data/get-quarterly-metrics';
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

async function BoxplotContent() {
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

  const result = await resolveActionResult(getQuarterlyMetrics(filters));

  return (
    <BoxplotChart
      title='Distribución de concentraciones por año'
      data={result.data}
      yAxisLabel='Concentración [µg/l]'
      referenceLines={[
        {
          value: result.guideLevel,
          label: 'Nivel Guía',
          color: 'var(--destructive)',
          strokeDasharray: '5 5'
        }
      ]}
      className='h-full'
    />
  );
}

export default async function BoxplotPage(props: PageProps) {
  const searchParams = await props.searchParams;
  substanceSearchParamsCache.parse(searchParams);

  const key = serializeSubstanceParams({ ...searchParams });

  return (
    <Suspense key={key} fallback={<Skeleton className='h-full w-full' />}>
      <BoxplotContent />
    </Suspense>
  );
}
