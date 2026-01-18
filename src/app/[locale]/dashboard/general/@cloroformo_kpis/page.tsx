import {
  SubstanceKpis,
  SubstanceKpisSkeleton
} from '@/features/dashboards/shared/components/substance-kpis';
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

const CLOROFORMO_SUBSTANCE_ID = '67-66-3';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function KpisContent() {
  const t = await getTranslations('general');
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
    substance: CLOROFORMO_SUBSTANCE_ID,
    ...(wellType && { wellType }),
    ...(area && { area }),
    ...(wellsArray && { wells: wellsArray }),
    sampleType
  };

  const [generalMetrics, wellMetricsResult] = await Promise.all([
    resolveActionResult(getGeneralMetrics(filters)),
    resolveActionResult(getWellMetrics(filters))
  ]);

  return (
    <SubstanceKpis
      title={t('chloroform')}
      generalMetrics={generalMetrics}
      wellMetrics={wellMetricsResult.data}
      unit={generalMetrics.unit}
    />
  );
}

export default async function CloroformoKpisPage(props: PageProps) {
  const searchParams = await props.searchParams;
  baseSearchParamsCache.parse(searchParams);

  const key = serializeBaseParams({ ...searchParams });

  return (
    <Suspense key={key} fallback={<SubstanceKpisSkeleton />}>
      <KpisContent />
    </Suspense>
  );
}
