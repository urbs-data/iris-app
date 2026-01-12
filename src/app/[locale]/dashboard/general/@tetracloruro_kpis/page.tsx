import {
  SubstanceKpis,
  SubstanceKpisSkeleton
} from '@/features/shared/components/substance-kpis';
import { getGeneralMetrics } from '@/features/substance/data/get-general-metrics';
import { getWellMetrics } from '@/features/substance/data/get-well-metrics';
import {
  baseSearchParamsCache,
  serializeBaseParams
} from '@/features/shared/searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

const TETRACLORURO_SUBSTANCE_ID = '56-23-5';

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

  return (
    <SubstanceKpis
      title={t('carbonTetrachloride')}
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
