import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { reportsSerialize } from '../searchparams';
import RecentReportsListing from './recent-reports-listing';
import { ReportForm } from './report-form';

interface ReportsPageContentProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ReportsPageContent({
  searchParams
}: ReportsPageContentProps) {
  const key = reportsSerialize({ ...searchParams });

  return (
    <div className='grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3'>
      <div className='overflow-y-auto lg:col-span-1'>
        <ReportForm />
      </div>

      <div className='flex flex-1 flex-col lg:col-span-2'>
        <Suspense
          key={key}
          fallback={
            <DataTableSkeleton
              columnCount={5}
              rowCount={5}
              withToolbar={false}
            />
          }
        >
          <RecentReportsListing />
        </Suspense>
      </div>
    </div>
  );
}
