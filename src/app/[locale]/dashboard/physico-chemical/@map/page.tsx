import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/charts';
import { FqMapContent } from './map-content';
import { getFqWellMetrics } from '@/features/dashboards/physico-chemical/data/get-fq-well-metrics';
import {
  fqSearchParamsCache,
  serializeFqParams
} from '@/features/dashboards/physico-chemical/searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { SearchParams } from 'nuqs/server';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function MapContentWrapper() {
  const t = await getTranslations('dashboard.noData');
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

  const result = await resolveActionResult(getFqWellMetrics(filters));

  if (!result.data || result.data.length === 0) {
    return <EmptyState title={t('title')} description={t('mapDescription')} />;
  }

  return <FqMapContent data={result.data} />;
}

export default async function MapPage(props: PageProps) {
  const searchParams = await props.searchParams;
  fqSearchParamsCache.parse(searchParams);

  const key = serializeFqParams({ ...searchParams });

  return (
    <Suspense key={key} fallback={<Skeleton className='h-full w-full' />}>
      <MapContentWrapper />
    </Suspense>
  );
}
