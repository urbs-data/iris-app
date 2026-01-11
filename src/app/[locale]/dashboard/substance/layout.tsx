import React from 'react';
import { Suspense } from 'react';
import { SubstanceFilters } from '@/features/substance/components/substance-filters';
import { Skeleton } from '@/components/ui/skeleton';

interface SubstanceLayoutProps {
  kpis: React.ReactNode;
  line_chart: React.ReactNode;
  boxplot: React.ReactNode;
  map: React.ReactNode;
}

export default function SubstanceLayout({
  kpis,
  line_chart,
  boxplot,
  map
}: SubstanceLayoutProps) {
  return (
    <div className='flex flex-col gap-2 px-4 pb-4 md:px-6 lg:h-[calc(100dvh-52px)] lg:overflow-hidden lg:pb-0'>
      {/* Filters Row */}
      <div className='shrink-0'>
        <Suspense fallback={<Skeleton className='h-10 w-full' />}>
          <SubstanceFilters />
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
  );
}
