import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function ReportsPageContentSkeleton() {
  return (
    <div className='grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3'>
      <div className='lg:col-span-1'>
        <Skeleton className='mb-4 h-10 w-full max-w-md' />
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-48' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <Skeleton className='h-9 w-full' />
            <Skeleton className='h-9 w-full' />
            <Skeleton className='h-9 w-full' />
            <Skeleton className='h-9 w-full' />
            <Skeleton className='h-9 w-full' />
          </CardContent>
        </Card>
      </div>

      <div className='flex flex-1 flex-col lg:col-span-2'>
        <Skeleton className='mb-4 h-7 w-64' />
        <DataTableSkeleton columnCount={5} rowCount={5} withToolbar={false} />
      </div>
    </div>
  );
}
