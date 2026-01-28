import React from 'react';
import { Suspense } from 'react';
import { getTranslations, getLocale } from 'next-intl/server';
import { UnifiedFiltersButton } from '@/features/dashboards/shared/components/unified-filters-button';
import { Skeleton } from '@/components/ui/skeleton';
import PageContainer from '@/components/layout/page-container';
import {
  substanceInfoContentEs,
  substanceInfoContentEn
} from '@/config/infoconfig';

interface SubstanceLayoutProps {
  kpis: React.ReactNode;
  line_chart: React.ReactNode;
  boxplot: React.ReactNode;
  map: React.ReactNode;
}

export default async function SubstanceLayout({
  kpis,
  line_chart,
  boxplot,
  map
}: SubstanceLayoutProps) {
  const locale = await getLocale();
  const t = await getTranslations('dashboard.substance');

  const infoContent =
    locale === 'en' ? substanceInfoContentEn : substanceInfoContentEs;

  return (
    <PageContainer
      scrollable={false}
      pageTitle={t('title')}
      infoContent={infoContent}
    >
      <div className='flex flex-1 flex-col gap-2 overflow-hidden'>
        {/* Filters Row */}
        <div className='shrink-0'>
          <Suspense fallback={<Skeleton className='h-10 w-full' />}>
            <UnifiedFiltersButton showSubstanceFilter={true} />
          </Suspense>
        </div>

        {/* KPIs Row */}
        <div className='shrink-0'>{kpis}</div>

        {/* Main Content Grid: Charts + Map */}
        <div className='grid flex-1 auto-rows-auto grid-cols-1 gap-2 lg:min-h-0 lg:auto-rows-auto lg:grid-cols-3 lg:grid-rows-1'>
          {/* Left Column: Charts stacked */}
          <div className='grid auto-rows-auto gap-2 lg:col-span-2 lg:min-h-0 lg:grid-rows-2'>
            {/* Line Chart 1 */}
            <div className='lg:min-h-0'>{line_chart}</div>
            {/* Boxplot */}
            <div className='lg:min-h-0'>{boxplot}</div>
          </div>

          {/* Right Column: Map spanning 2 rows */}
          <div className='lg:row-span-2 lg:min-h-0'>{map}</div>
        </div>
      </div>
    </PageContainer>
  );
}
