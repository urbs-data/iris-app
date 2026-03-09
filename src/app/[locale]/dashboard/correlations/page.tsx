import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { CorrelationsFiltersButton } from '@/features/dashboards/correlations/components/correlations-filters-button';
import { CorrelationsDashboard } from '@/features/dashboards/correlations/components/correlations-dashboard';
import {
  correlationsSearchParamsCache,
  serializeCorrelationsParams
} from '@/features/dashboards/correlations/searchparams';

interface CorrelationsPageProps {
  searchParams: Promise<SearchParams>;
}

function CorrelationsDashboardSkeleton() {
  return (
    <div className='flex flex-1 gap-4'>
      <div className='flex min-w-0 flex-1 flex-col gap-4'>
        <Skeleton className='h-64 w-full rounded-xl' />
        <Skeleton className='h-48 w-full rounded-xl' />
      </div>
      <div className='flex w-72 shrink-0 flex-col gap-3'>
        <Skeleton className='h-6 w-40 rounded' />
        <Skeleton className='h-24 w-full rounded-xl' />
        <Skeleton className='h-24 w-full rounded-xl' />
        <Skeleton className='h-24 w-full rounded-xl' />
      </div>
    </div>
  );
}

async function EmptySubstanceState() {
  const t = await getTranslations('dashboard.correlations');
  return (
    <div className='flex flex-1 items-center justify-center rounded-xl border border-dashed p-12'>
      <p className='text-muted-foreground text-center text-sm'>
        {t('emptySubstance')}
      </p>
    </div>
  );
}

export default async function CorrelationsPage({
  searchParams
}: CorrelationsPageProps) {
  const t = await getTranslations('dashboard.correlations');
  const params = await correlationsSearchParamsCache.parse(searchParams);
  const paramsKey = serializeCorrelationsParams(params);

  return (
    <PageContainer
      scrollable={true}
      pageTitle={t('title')}
      pageDescription={t('description')}
      pageHeaderAction={
        <Suspense fallback={<Skeleton className='h-9 w-24' />}>
          <CorrelationsFiltersButton />
        </Suspense>
      }
    >
      <div className='flex flex-1 flex-col gap-4'>
        {params.substance ? (
          <Suspense
            key={paramsKey}
            fallback={<CorrelationsDashboardSkeleton />}
          >
            <CorrelationsDashboard
              substance={params.substance}
              dateFrom={params.dateFrom}
              dateTo={params.dateTo}
              wells={params.wells}
            />
          </Suspense>
        ) : (
          <EmptySubstanceState />
        )}
      </div>
    </PageContainer>
  );
}
