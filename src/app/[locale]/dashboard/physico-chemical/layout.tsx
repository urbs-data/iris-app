import React from 'react';
import { Suspense } from 'react';
import { getTranslations, getLocale } from 'next-intl/server';
import { PhysicoChemicalFiltersButton } from '@/features/dashboards/physico-chemical/components/physico-chemical-filters-button';
import { Skeleton } from '@/components/ui/skeleton';
import PageContainer from '@/components/layout/page-container';
import {
  physicoChemicalInfoContentEs,
  physicoChemicalInfoContentEn
} from '@/config/infoconfig';

interface PhysicoChemicalLayoutProps {
  fq_kpis: React.ReactNode;
  substance_kpis: React.ReactNode;
  line_chart: React.ReactNode;
  map: React.ReactNode;
}

export default async function PhysicoChemicalLayout({
  fq_kpis,
  substance_kpis,
  line_chart,
  map
}: PhysicoChemicalLayoutProps) {
  const locale = await getLocale();
  const t = await getTranslations('dashboard.physicoChemical');

  const infoContent =
    locale === 'en'
      ? physicoChemicalInfoContentEn
      : physicoChemicalInfoContentEs;

  return (
    <PageContainer
      scrollable={false}
      pageTitle={t('title')}
      infoContent={infoContent}
    >
      <div className='flex flex-1 flex-col gap-2 overflow-hidden lg:max-h-[calc(100dvh-52px-80px)]'>
        <div className='shrink-0'>
          <Suspense fallback={<Skeleton className='h-10 w-full' />}>
            <PhysicoChemicalFiltersButton />
          </Suspense>
        </div>

        <div className='grid shrink-0 grid-cols-1 gap-2 md:grid-cols-2'>
          {fq_kpis}
          {substance_kpis}
        </div>

        <div className='grid flex-1 auto-rows-auto grid-cols-1 gap-2 lg:min-h-0 lg:auto-rows-auto lg:grid-cols-3 lg:grid-rows-1'>
          <div className='lg:col-span-2 lg:min-h-0'>{line_chart}</div>
          <div className='lg:min-h-0'>{map}</div>
        </div>
      </div>
    </PageContainer>
  );
}
