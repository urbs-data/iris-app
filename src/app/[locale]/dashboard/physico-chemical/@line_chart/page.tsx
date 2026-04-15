import { LineChart, EmptyState } from '@/components/charts';
import type { SeriesConfig } from '@/components/charts/line-chart';
import { getFqDailyMetrics } from '@/features/dashboards/physico-chemical/data/get-fq-daily-metrics';
import { getDailyMetrics } from '@/features/dashboards/substance/data/get-daily-metrics';
import { getSubstances } from '@/features/dashboards/substance/data/get-substances';
import { WellType, SampleType } from '@/features/dashboards/substance/types';
import {
  fqSearchParamsCache,
  serializeFqParams
} from '@/features/dashboards/physico-chemical/searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations, getLocale } from 'next-intl/server';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

type CombinedDataPoint = {
  date: Date;
  fqValue: number | null;
  substanceValue: number | null;
};

function mergeTimeSeries(
  fqData: { date: Date; value: number }[],
  substanceData: { date: Date; value: number }[]
): CombinedDataPoint[] {
  const map = new Map<string, CombinedDataPoint>();

  for (const point of fqData) {
    const key = point.date.toISOString();
    map.set(key, {
      date: point.date,
      fqValue: point.value,
      substanceValue: null
    });
  }

  for (const point of substanceData) {
    const key = point.date.toISOString();
    const existing = map.get(key);
    if (existing) {
      existing.substanceValue = point.value;
    } else {
      map.set(key, {
        date: point.date,
        fqValue: null,
        substanceValue: point.value
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

async function LineChartContent() {
  const t = await getTranslations('dashboard');
  const locale = await getLocale();
  const dateFrom = fqSearchParamsCache.get('dateFrom');
  const dateTo = fqSearchParamsCache.get('dateTo');
  const parametro = fqSearchParamsCache.get('parametro');
  const substance = fqSearchParamsCache.get('substance');
  const area = fqSearchParamsCache.get('area');
  const wells = fqSearchParamsCache.get('wells');

  if (!parametro || !substance) return null;

  const wellsArray = wells ? wells.split(',').filter(Boolean) : undefined;

  const fqFilters = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(parametro && { parametro }),
    ...(substance && { substance }),
    ...(area && { area }),
    ...(wellsArray && { wells: wellsArray })
  };

  const substanceFilters = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(substance && { substance }),
    wellType: WellType.MONITORING,
    ...(area && { area }),
    ...(wellsArray && { wells: wellsArray }),
    sampleType: SampleType.WATER
  };

  const [fqResult, substanceResult, substancesResult] = await Promise.all([
    resolveActionResult(getFqDailyMetrics(fqFilters)),
    resolveActionResult(getDailyMetrics(substanceFilters)),
    resolveActionResult(getSubstances())
  ]);

  const substances = substancesResult ?? [];
  const substanceName =
    substance && substances.length > 0
      ? (substances.find((s) => s.value === substance)?.label ??
        t('physicoChemical.substanceCompound'))
      : t('physicoChemical.substanceCompound');

  const hasFqData = fqResult.data && fqResult.data.length > 0;
  const hasSubstanceData =
    substanceResult.data && substanceResult.data.length > 0;

  if (!hasFqData && !hasSubstanceData) {
    return (
      <EmptyState
        title={t('noData.title')}
        description={t('noData.description')}
      />
    );
  }

  const combinedData = mergeTimeSeries(
    fqResult.data || [],
    substanceResult.data || []
  );

  const series: SeriesConfig[] = [
    {
      dataKey: 'fqValue',
      label: parametro || 'pH',
      unit: fqResult.unit || '',
      color: 'var(--primary)',
      yAxisId: 'left',
      yAxisLabel: fqResult.unit ? `${parametro} [${fqResult.unit}]` : parametro
    },
    {
      dataKey: 'substanceValue',
      label: substanceName,
      unit: substanceResult.unit || 'µg/l',
      color: 'var(--chart-2)',
      yAxisId: 'right',
      yAxisLabel: `${substanceName} [${substanceResult.unit || 'µg/l'}]`
    }
  ];

  return (
    <LineChart
      title={t('physicoChemical.combinedEvolution')}
      data={combinedData}
      series={series}
      locale={locale === 'en' ? 'en-US' : 'es-ES'}
      timeMode='daily'
    />
  );
}

export default async function LineChartPage(props: PageProps) {
  const searchParams = await props.searchParams;
  fqSearchParamsCache.parse(searchParams);

  const key = serializeFqParams({ ...searchParams });

  return (
    <Suspense key={key} fallback={<Skeleton className='h-full w-full' />}>
      <LineChartContent />
    </Suspense>
  );
}
