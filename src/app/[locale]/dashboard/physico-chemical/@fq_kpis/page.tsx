import { KpiCard, KpiCardSkeleton, EmptyState } from '@/components/charts';
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
  const t = await getTranslations();
  const dateFrom = fqSearchParamsCache.get('dateFrom');
  const dateTo = fqSearchParamsCache.get('dateTo');
  const parametro = fqSearchParamsCache.get('parametro');
  const substance = fqSearchParamsCache.get('substance');

  if (!parametro || !substance) return null;

  const area = fqSearchParamsCache.get('area');
  const wells = fqSearchParamsCache.get('wells');
  const wellsArray = wells ? wells.split(',').filter(Boolean) : undefined;

  const filters = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(parametro && { parametro }),
    ...(substance && { substance }),
    ...(area && { area }),
    ...(wellsArray && { wells: wellsArray })
  };

  const metrics = await resolveActionResult(getFqGeneralMetrics(filters));

  if (metrics.sampleCount === 0) {
    return (
      <EmptyState
        title={t('dashboard.noData.title')}
        description={t('dashboard.noData.kpisDescription')}
      />
    );
  }

  const kpis = [
    { label: t('dashboard.kpi.sampleCount'), value: metrics.sampleCount },
    {
      label: t('dashboard.kpi.lastValue'),
      value: metrics.lastValue.toFixed(2),
      unit: metrics.unit
    },
    {
      label: t('dashboard.kpi.average'),
      value: metrics.average.toFixed(2),
      unit: metrics.unit
    },
    {
      label: t('dashboard.kpi.minimum'),
      value: metrics.min.toFixed(2),
      unit: metrics.unit
    },
    {
      label: t('dashboard.kpi.maximum'),
      value: metrics.max.toFixed(2),
      unit: metrics.unit
    }
  ];

  return <KpiCard title={parametro ?? undefined} items={kpis} />;
}

export default async function FqKpisPage(props: PageProps) {
  const searchParams = await props.searchParams;
  fqSearchParamsCache.parse(searchParams);

  const key = serializeFqParams({ ...searchParams });

  return (
    <Suspense key={key} fallback={<KpiCardSkeleton itemCount={5} />}>
      <FqKpisContent />
    </Suspense>
  );
}
