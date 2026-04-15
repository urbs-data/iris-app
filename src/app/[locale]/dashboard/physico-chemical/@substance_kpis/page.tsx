import { KpiCard, KpiCardSkeleton, EmptyState } from '@/components/charts';
import { getGeneralMetrics } from '@/features/dashboards/substance/data/get-general-metrics';
import { getSubstances } from '@/features/dashboards/substance/data/get-substances';
import { WellType, SampleType } from '@/features/dashboards/substance/types';
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

async function SubstanceKpisContent() {
  const t = await getTranslations();
  const dateFrom = fqSearchParamsCache.get('dateFrom');
  const dateTo = fqSearchParamsCache.get('dateTo');
  const substance = fqSearchParamsCache.get('substance');

  if (!substance) return null;

  const area = fqSearchParamsCache.get('area');
  const wells = fqSearchParamsCache.get('wells');
  const wellsArray = wells ? wells.split(',').filter(Boolean) : undefined;

  const filters = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(substance && { substance }),
    wellType: WellType.MONITORING,
    ...(area && { area }),
    ...(wellsArray && { wells: wellsArray }),
    sampleType: SampleType.WATER
  };

  const [metrics, substancesResult] = await Promise.all([
    resolveActionResult(getGeneralMetrics(filters)),
    resolveActionResult(getSubstances())
  ]);

  const substances = substancesResult ?? [];
  const substanceName =
    substance && substances.length > 0
      ? (substances.find((s) => s.value === substance)?.label ?? substance)
      : undefined;

  if (metrics.samples === 0) {
    return (
      <EmptyState
        title={t('dashboard.noData.title')}
        description={t('dashboard.noData.kpisDescription')}
      />
    );
  }

  const kpis = [
    { label: t('dashboard.kpi.sampleCount'), value: metrics.samples },
    {
      label: t('dashboard.kpi.average'),
      value: metrics.average.toFixed(2),
      unit: metrics.unit
    },
    {
      label: t('dashboard.kpi.median'),
      value: metrics.median.toFixed(2),
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
    },
    {
      label: t('dashboard.kpi.guidelineLevel'),
      value: metrics.guideLevel,
      unit: metrics.unit
    }
  ];

  return <KpiCard title={substanceName} items={kpis} />;
}

export default async function SubstanceKpisPage(props: PageProps) {
  const searchParams = await props.searchParams;
  fqSearchParamsCache.parse(searchParams);

  const key = serializeFqParams({ ...searchParams });

  return (
    <Suspense key={key} fallback={<KpiCardSkeleton itemCount={6} />}>
      <SubstanceKpisContent />
    </Suspense>
  );
}
