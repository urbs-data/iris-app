import React from 'react';
import { Suspense } from 'react';
import { getTranslations, getLocale } from 'next-intl/server';
import { PhysicoChemicalFiltersButton } from '@/features/dashboards/physico-chemical/components/physico-chemical-filters-button';
import { PhysicoChemicalContent } from '@/features/dashboards/physico-chemical/components/physico-chemical-content';
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
      pageHeaderAction={
        <Suspense fallback={<Skeleton className='h-10 w-full' />}>
          <PhysicoChemicalFiltersButton />
        </Suspense>
      }
    >
      <PhysicoChemicalContent
        fq_kpis={fq_kpis}
        substance_kpis={substance_kpis}
        line_chart={line_chart}
        map={map}
      />
    </PageContainer>
  );
}
