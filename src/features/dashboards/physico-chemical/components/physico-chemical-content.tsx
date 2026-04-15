'use client';

import React from 'react';
import { useQueryStates } from 'nuqs';
import { useTranslations } from 'next-intl';
import { fqSearchParams } from '@/features/dashboards/physico-chemical/searchparams';

interface PhysicoChemicalContentProps {
  fq_kpis: React.ReactNode;
  substance_kpis: React.ReactNode;
  line_chart: React.ReactNode;
  map: React.ReactNode;
}

export function PhysicoChemicalContent({
  fq_kpis,
  substance_kpis,
  line_chart,
  map
}: PhysicoChemicalContentProps) {
  const [params] = useQueryStates(fqSearchParams);
  const t = useTranslations('dashboard.physicoChemical');

  if (!params.substance || !params.parametro) {
    return (
      <div className='flex items-center justify-center rounded-xl border border-dashed p-12'>
        <p className='text-muted-foreground text-center text-sm'>
          {t('emptyState')}
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col gap-2 overflow-hidden lg:max-h-[calc(100dvh-52px-80px)]'>
      <div className='grid shrink-0 grid-cols-1 gap-2 md:grid-cols-9'>
        <div className='md:col-span-4'>{fq_kpis}</div>
        <div className='md:col-span-5'>{substance_kpis}</div>
      </div>

      <div className='grid flex-1 auto-rows-auto grid-cols-1 gap-2 lg:min-h-0 lg:auto-rows-auto lg:grid-cols-3 lg:grid-rows-1'>
        <div className='lg:col-span-2 lg:min-h-0'>{line_chart}</div>
        <div className='lg:min-h-0'>{map}</div>
      </div>
    </div>
  );
}
