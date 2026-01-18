import { BoxplotChart } from '@/components/charts';
import { getQuarterlyMetrics } from '@/features/dashboards/substance/data/get-quarterly-metrics';
import {
  substanceSearchParamsCache,
  serializeSubstanceParams
} from '@/features/dashboards/substance/searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function BoxplotContent() {
  const t = await getTranslations('dashboard');
  const dateFrom = substanceSearchParamsCache.get('dateFrom');
  const dateTo = substanceSearchParamsCache.get('dateTo');
  const substance = substanceSearchParamsCache.get('substance');
  const wellType = substanceSearchParamsCache.get('wellType');
  const area = substanceSearchParamsCache.get('area');
  const wells = substanceSearchParamsCache.get('wells');
  const sampleType = substanceSearchParamsCache.get('sampleType');

  const wellsArray = wells ? wells.split(',').filter(Boolean) : undefined;

  const filters = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(substance && { substance }),
    ...(wellType && { wellType }),
    ...(area && { area }),
    ...(wellsArray && { wells: wellsArray }),
    sampleType
  };

  const result = await resolveActionResult(getQuarterlyMetrics(filters));

  return (
    <BoxplotChart
      title={t('boxplot.defaultTitle')}
      data={result.data}
      yAxisLabel={`${t('lineplot.concentration')} [${result.unit}]`}
      referenceLines={[
        {
          value: result.guideLevel,
          label: t('lineplot.guidelineLevel'),
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
