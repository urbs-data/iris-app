import { EmptyState } from '@/components/charts';
import {
  CombinedKpiCard,
  CombinedKpiCardSkeleton
} from '@/features/dashboards/physico-chemical/components/combined-kpi-card';
import { getFqGeneralMetrics } from '@/features/dashboards/physico-chemical/data/get-fq-general-metrics';
import {
  fqSearchParamsCache,
  serializeFqParams
} from '@/features/dashboards/physico-chemical/searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function FqKpisContent() {
  const t = await getTranslations('dashboard');
  const dateFrom = fqSearchParamsCache.get('dateFrom');
  const dateTo = fqSearchParamsCache.get('dateTo');
  const parametro = fqSearchParamsCache.get('parametro');
  const substance = fqSearchParamsCache.get('substance');
  const wellType = fqSearchParamsCache.get('wellType');
  const area = fqSearchParamsCache.get('area');
  const wells = fqSearchParamsCache.get('wells');
  const sampleType = fqSearchParamsCache.get('sampleType');

  const wellsArray = wells ? wells.split(',').filter(Boolean) : undefined;

  const filters = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(parametro && { parametro }),
    ...(substance && { substance }),
    ...(wellType && { wellType }),
    ...(area && { area }),
    ...(wellsArray && { wells: wellsArray }),
    sampleType
  };

  const metrics = await resolveActionResult(getFqGeneralMetrics(filters));

  if (metrics.sampleCount === 0) {
    return (
      <EmptyState
        title={t('noData.title')}
        description={t('noData.kpisDescription')}
      />
    );
  }

  const items = [
    {
      label: t('kpi.average'),
      value: metrics.average.toFixed(2),
      unit: metrics.unit
    },
    {
      label: t('kpi.minimum'),
      value: metrics.min.toFixed(2),
      unit: metrics.unit
    },
    {
      label: t('kpi.maximum'),
      value: metrics.max.toFixed(2),
      unit: metrics.unit
    }
  ];

  return (
    <CombinedKpiCard
      title={`${t('physicoChemical.fqParameter')} (${parametro})`}
      highlightValue={metrics.lastValue.toFixed(2)}
      highlightUnit={metrics.unit}
      items={items}
    />
  );
}

export default async function FqKpisPage(props: PageProps) {
  const searchParams = await props.searchParams;
  fqSearchParamsCache.parse(searchParams);

  const key = serializeFqParams({ ...searchParams });

  return (
    <Suspense key={key} fallback={<CombinedKpiCardSkeleton />}>
      <FqKpisContent />
    </Suspense>
  );
}
