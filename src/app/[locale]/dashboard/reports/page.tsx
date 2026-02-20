import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { reportsSearchParamsCache } from '@/features/reports/searchparams';
import ReportsPageContent from '@/features/reports/components/reports-page-content';

export const metadata = {
  title: 'Dashboard: Reports'
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function ReportsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const t = await getTranslations('reports');

  reportsSearchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false} pageTitle={t('title')}>
      <ReportsPageContent searchParams={searchParams} />
    </PageContainer>
  );
}
