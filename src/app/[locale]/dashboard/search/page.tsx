import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import SearchListing from '@/features/search/components/search-listing';
import { searchParamsCache, serialize } from '@/features/search/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { SearchToolbar } from '@/features/search/components/search-table/search-toolbar';

export const metadata = {
  title: 'Dashboard: Search'
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const t = await getTranslations('search');

  searchParamsCache.parse(searchParams);

  const key = serialize({ ...searchParams });

  return (
    <PageContainer scrollable={false} pageTitle={t('title')}>
      <Suspense fallback={<div className='h-9' />}>
        <SearchToolbar />
      </Suspense>

      <Suspense
        key={key}
        fallback={
          <DataTableSkeleton
            columnCount={8}
            rowCount={10}
            filterCount={5}
            withToolbar={false}
          />
        }
      >
        <SearchListing />
      </Suspense>
    </PageContainer>
  );
}
