import { substanceSearchParamsCache } from '@/features/substance/searchparams';
import { SearchParams } from 'nuqs/server';

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function SubstancePage(props: PageProps) {
  const searchParams = await props.searchParams;
  // Parse the search params to populate the cache
  substanceSearchParamsCache.parse(searchParams);

  return null;
}
