import { LineChart } from '@/components/charts';
import { getMonthlyMetrics } from '@/features/substance/data/get-monthly-metrics';
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

async function LineChartContent() {
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
    ...(wellType && { wellType }),
    ...(area && { area }),
    ...(well && { well }),
    sampleType
  };

  const result = await resolveActionResult(getMonthlyMetrics(filters));

  return (
    <LineChart
      title='Concentración promedio por período'
      data={result.data}
      yAxisLabel={`Concentración [${result.unit}]`}
      tooltipLabel='Concentración promedio'
      tooltipUnit={result.unit}
      referenceLines={[
        {
          value: result.guideLevel,
          label: 'Nivel Guía',
          color: 'var(--destructive)',
          strokeDasharray: '5 5'
        }
      ]}
    />
  );
}

export default async function LineChartPage(props: PageProps) {
  const searchParams = await props.searchParams;
  substanceSearchParamsCache.parse(searchParams);

  const key = serializeSubstanceParams({ ...searchParams });

  return (
    <Suspense key={key} fallback={<Skeleton className='h-full w-full' />}>
      <LineChartContent />
    </Suspense>
  );
}
