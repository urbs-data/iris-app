import { KpiCard } from '@/components/charts';
import { getGeneralMetrics } from '@/features/substance/data/get-general-metrics';
import {
  substanceSearchParamsCache,
  serializeSubstanceParams
} from '@/features/substance/searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function KpisContent() {
  const t = await getTranslations('dashboard.kpi');
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

  const metrics = await resolveActionResult(getGeneralMetrics(filters));

  const mainKpis = [
    { label: t('sampleCount'), value: metrics.samples },
    {
      label: t('average'),
      value: metrics.average.toFixed(1),
      unit: metrics.unit
    },
    {
      label: t('median'),
      value: metrics.median.toFixed(2),
      unit: metrics.unit
    },
    { label: t('minimum'), value: metrics.min.toFixed(2), unit: metrics.unit },
    { label: t('maximum'), value: metrics.max.toFixed(2), unit: metrics.unit },
    {
      label: t('standardDeviation'),
      value: metrics.stdDev.toFixed(2),
      unit: metrics.unit
    }
  ];

  const guideKpis = [
    {
      label: t('guidelineLevel'),
      value: metrics.guideLevel,
      unit: metrics.unit
    },
    {
      label: t('percentageToGuideline'),
      value: `${metrics.vsGuidePercent.toFixed(2)} %`,
      className: metrics.vsGuidePercent > 100 ? 'text-destructive' : ''
    },
    {
      label: t('percentageToMaximum'),
      value: `${metrics.vsMaxPercent.toFixed(2)} %`,
      className: metrics.vsMaxPercent < 0 ? 'text-green-600' : ''
    }
  ];

  return (
    <div className='grid grid-cols-1 gap-2 md:grid-cols-3'>
      <KpiCard items={mainKpis} className='md:col-span-2' />
      <KpiCard items={guideKpis} />
    </div>
  );
}

export default async function KpisPage(props: PageProps) {
  const searchParams = await props.searchParams;
  substanceSearchParamsCache.parse(searchParams);

  const key = serializeSubstanceParams({ ...searchParams });

  return (
    <Suspense
      key={key}
      fallback={
        <div className='grid grid-cols-1 gap-2 md:grid-cols-3'>
          <Skeleton className='h-26 md:col-span-2' />
          <Skeleton className='h-26' />
        </div>
      }
    >
      <KpisContent />
    </Suspense>
  );
}
