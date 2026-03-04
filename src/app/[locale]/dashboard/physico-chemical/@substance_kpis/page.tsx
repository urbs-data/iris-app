import { EmptyState } from '@/components/charts';
import {
  CombinedKpiCard,
  CombinedKpiCardSkeleton
} from '@/features/dashboards/physico-chemical/components/combined-kpi-card';
import { getGeneralMetrics } from '@/features/dashboards/substance/data/get-general-metrics';
import { getSubstances } from '@/features/dashboards/substance/data/get-substances';
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
  const t = await getTranslations('dashboard');
  const dateFrom = fqSearchParamsCache.get('dateFrom');
  const dateTo = fqSearchParamsCache.get('dateTo');
  const substance = fqSearchParamsCache.get('substance');
  const wellType = fqSearchParamsCache.get('wellType');
  const area = fqSearchParamsCache.get('area');
  const wells = fqSearchParamsCache.get('wells');
  const sampleType = fqSearchParamsCache.get('sampleType');

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

  const [metrics, substancesResult] = await Promise.all([
    resolveActionResult(getGeneralMetrics(filters)),
    resolveActionResult(getSubstances())
  ]);

  const substances = substancesResult ?? [];
  const substanceName =
    substance && substances.length > 0
      ? (substances.find((s) => s.value === substance)?.label ??
        t('physicoChemical.substanceCompound'))
      : t('physicoChemical.substanceCompound');

  if (metrics.samples === 0) {
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
    },
    {
      label: t('kpi.guidelineLevel'),
      value: metrics.guideLevel,
      unit: metrics.unit,
      className: metrics.average > metrics.guideLevel ? 'text-destructive' : ''
    }
  ];

  return (
    <CombinedKpiCard
      title={substanceName}
      highlightValue={metrics.max.toFixed(2)}
      highlightUnit={metrics.unit}
      items={items}
    />
  );
}

export default async function SubstanceKpisPage(props: PageProps) {
  const searchParams = await props.searchParams;
  fqSearchParamsCache.parse(searchParams);

  const key = serializeFqParams({ ...searchParams });

  return (
    <Suspense key={key} fallback={<CombinedKpiCardSkeleton itemCount={5} />}>
      <SubstanceKpisContent />
    </Suspense>
  );
}
