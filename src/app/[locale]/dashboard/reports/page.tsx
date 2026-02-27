import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import {
  reportsSearchParamsCache,
  reportsSerialize
} from '@/features/reports/searchparams';
import RecentReportsListing from '@/features/reports/components/recent-reports-listing';
import { NewReportButton } from '@/features/reports/components/new-report-button';
import {
  reportsListInfoContentEs,
  reportsListInfoContentEn
} from '@/config/infoconfig';

export const metadata = {
  title: 'Dashboard: Reports'
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function ReportsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const { locale } = await props.params;
  const t = await getTranslations('reports');

  reportsSearchParamsCache.parse(searchParams);
  const key = reportsSerialize({ ...searchParams });

  const infoContent =
    locale === 'en' ? reportsListInfoContentEn : reportsListInfoContentEs;

  return (
    <PageContainer
      scrollable={false}
      pageTitle={t('title')}
      infoContent={infoContent}
      pageHeaderAction={<NewReportButton />}
    >
      <Suspense
        key={key}
        fallback={
          <DataTableSkeleton columnCount={5} rowCount={5} withToolbar={false} />
        }
      >
        <RecentReportsListing />
      </Suspense>
    </PageContainer>
  );
}
