import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import {
  searchParamsCache,
  serialize
} from '@/features/documents/search/searchparams';
import { SearchToolbar } from '@/features/documents/search/components/search-table/search-toolbar';
import SearchListing from '@/features/documents/search/components/search-listing';
import { searchInfoContentEs, searchInfoContentEn } from '@/config/infoconfig';

export const metadata = {
  title: 'Dashboard: Search'
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const { locale } = await props.params;
  const t = await getTranslations('search');

  searchParamsCache.parse(searchParams);

  const key = serialize({ ...searchParams });

  const infoContent =
    locale === 'en' ? searchInfoContentEn : searchInfoContentEs;

  return (
    <PageContainer
      scrollable={false}
      pageTitle={t('title')}
      infoContent={infoContent}
    >
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
