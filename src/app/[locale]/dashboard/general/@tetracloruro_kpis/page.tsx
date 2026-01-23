import {
  SubstanceKpisWithMap,
  SubstanceKpisSkeleton
} from '@/features/dashboards/shared/components/substance-kpis';
import { EmptyState } from '@/components/charts';
import { getGeneralMetrics } from '@/features/dashboards/substance/data/get-general-metrics';
import { getWellMetrics } from '@/features/dashboards/substance/data/get-well-metrics';
import {
  baseSearchParamsCache,
  serializeBaseParams
} from '@/features/dashboards/shared/searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

const TETRACLORURO_SUBSTANCE_ID = '56-23-5';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function KpisContent() {
  const t = await getTranslations();
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

  const [generalMetrics, wellMetricsResult] = await Promise.all([
    resolveActionResult(getGeneralMetrics(filters)),
    resolveActionResult(getWellMetrics(filters))
  ]);

  if (generalMetrics.samples === 0) {
    return (
      <EmptyState
        title={t('dashboard.noData.title')}
        description={t('dashboard.noData.kpisDescription')}
      />
    );
  }

  return (
    <SubstanceKpisWithMap
      title={t('general.carbonTetrachloride')}
      generalMetrics={generalMetrics}
      wellMetrics={wellMetricsResult.data}
      unit={generalMetrics.unit}
    />
  );
}

export default async function TetracloruroKpisPage(props: PageProps) {
  const searchParams = await props.searchParams;
  baseSearchParamsCache.parse(searchParams);

  const key = serializeBaseParams({ ...searchParams });

  return (
    <Suspense key={key} fallback={<SubstanceKpisSkeleton />}>
      <KpisContent />
    </Suspense>
  );
}
