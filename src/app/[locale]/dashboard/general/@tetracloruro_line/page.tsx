import { LineChart, EmptyState } from '@/components/charts';
import { getMonthlyMetrics } from '@/features/dashboards/substance/data/get-monthly-metrics';
import {
  baseSearchParamsCache,
  serializeBaseParams
} from '@/features/dashboards/shared/searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations, getLocale } from 'next-intl/server';

const TETRACLORURO_SUBSTANCE_ID = '56-23-5';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function LineChartContent() {
  const t = await getTranslations();
  const locale = await getLocale();
  const dateFrom = baseSearchParamsCache.get('dateFrom');
  const dateTo = baseSearchParamsCache.get('dateTo');
  const wellType = baseSearchParamsCache.get('wellType');
  const area = baseSearchParamsCache.get('area');
  const wells = baseSearchParamsCache.get('wells');
  const sampleType = baseSearchParamsCache.get('sampleType');

  const wellsArray = wells ? wells.split(',').filter(Boolean) : undefined;

  const filters = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    substance: TETRACLORURO_SUBSTANCE_ID,
    ...(wellType && { wellType }),
    ...(area && { area }),
    ...(wellsArray && { wells: wellsArray }),
    sampleType
  };

  const result = await resolveActionResult(getMonthlyMetrics(filters));

  if (!result.data || result.data.length === 0) {
    return (
      <EmptyState
        title={t('dashboard.noData.title')}
        description={t('dashboard.noData.description')}
      />
    );
  }

  return (
    <LineChart
      title={t('general.carbonTetrachlorideConcentration')}
      data={result.data}
      yAxisLabel={`${t('dashboard.lineplot.concentration')} [${result.unit}]`}
      tooltipLabel={t('dashboard.lineplot.average')}
      tooltipUnit={result.unit}
      locale={locale === 'en' ? 'en-US' : 'es-ES'}
      referenceLines={[
        {
          value: result.guideLevel,
          label: t('dashboard.lineplot.guidelineLevel'),
          color: 'var(--destructive)',
          strokeDasharray: '5 5'
        }
      ]}
    />
  );
}

export default async function TetracloruroLinePage(props: PageProps) {
  const searchParams = await props.searchParams;
  baseSearchParamsCache.parse(searchParams);

  const key = serializeBaseParams({ ...searchParams });

  return (
    <Suspense
      key={key}
      fallback={<Skeleton className='h-full w-full rounded-lg' />}
    >
      <LineChartContent />
    </Suspense>
  );
}
