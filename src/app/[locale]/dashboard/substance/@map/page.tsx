import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MapContent } from './map-content';
import { getWellMetrics } from '@/features/dashboards/substance/data/get-well-metrics';
import {
  substanceSearchParamsCache,
  serializeSubstanceParams
} from '@/features/dashboards/substance/searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { SearchParams } from 'nuqs/server';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function MapContentWrapper() {
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

  const result = await resolveActionResult(getWellMetrics(filters));

  return <MapContent data={result.data} guideLevel={result.guideLevel} />;
}

export default async function MapPage(props: PageProps) {
  const searchParams = await props.searchParams;
  substanceSearchParamsCache.parse(searchParams);

  const key = serializeSubstanceParams({ ...searchParams });

  return (
    <Suspense key={key} fallback={<Skeleton className='h-full w-full' />}>
      <MapContentWrapper />
    </Suspense>
  );
}
