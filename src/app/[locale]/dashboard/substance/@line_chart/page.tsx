import { LineChart } from '@/components/charts';
import { getMonthlyMetrics } from '@/features/dashboards/substance/data/get-monthly-metrics';
import {
  substanceSearchParamsCache,
  serializeSubstanceParams
} from '@/features/dashboards/substance/searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations, getLocale } from 'next-intl/server';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function LineChartContent() {
  const t = await getTranslations('dashboard.lineplot');
  const locale = await getLocale();
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

  const result = await resolveActionResult(getMonthlyMetrics(filters));

  return (
    <LineChart
      title={t('defaultTitle')}
      data={result.data}
      yAxisLabel={`${t('concentration')} [${result.unit}]`}
      tooltipLabel={t('average')}
      tooltipUnit={result.unit}
      locale={locale === 'en' ? 'en-US' : 'es-ES'}
      referenceLines={[
        {
          value: result.guideLevel,
          label: t('guidelineLevel'),
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
