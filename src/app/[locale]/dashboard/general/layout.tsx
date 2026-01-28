import React from 'react';
import { Suspense } from 'react';
import { getTranslations, getLocale } from 'next-intl/server';
import { UnifiedFiltersButton } from '@/features/dashboards/shared/components/unified-filters-button';
import { Skeleton } from '@/components/ui/skeleton';
import PageContainer from '@/components/layout/page-container';
import {
  generalInfoContentEs,
  generalInfoContentEn
} from '@/config/infoconfig';

interface GeneralLayoutProps {
  tetracloruro_line: React.ReactNode;
  tetracloruro_kpis: React.ReactNode;
  cloroformo_line: React.ReactNode;
  cloroformo_kpis: React.ReactNode;
}

export default async function GeneralLayout({
  tetracloruro_line,
  tetracloruro_kpis,
  cloroformo_line,
  cloroformo_kpis
}: GeneralLayoutProps) {
  const locale = await getLocale();
  const t = await getTranslations('dashboard.general');

  const infoContent =
    locale === 'en' ? generalInfoContentEn : generalInfoContentEs;

  return (
    <PageContainer
      scrollable={false}
      pageTitle={t('title')}
      infoContent={infoContent}
    >
      <div className='flex flex-1 flex-col gap-2 overflow-hidden'>
        <div className='shrink-0'>
          <Suspense fallback={<Skeleton className='h-10 w-full' />}>
            <UnifiedFiltersButton showSubstanceFilter={false} />
          </Suspense>
        </div>

        <div className='grid flex-1 auto-rows-auto grid-cols-1 gap-2 lg:min-h-0 lg:auto-rows-auto lg:grid-cols-2 lg:grid-rows-2'>
          <div className='lg:min-h-0'>{tetracloruro_line}</div>
          <div className='lg:min-h-0'>{tetracloruro_kpis}</div>
          <div className='lg:min-h-0'>{cloroformo_line}</div>
          <div className='lg:min-h-0'>{cloroformo_kpis}</div>
        </div>
      </div>
    </PageContainer>
  );
}
