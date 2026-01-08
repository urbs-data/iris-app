import { Skeleton } from '@/components/ui/skeleton';
import { SimpleDataTableSkeleton } from '@/components/ui/table/simple-data-table-skeleton';

export function FileExplorerSkeleton() {
  return (
    <div className='space-y-4'>
      {/* Breadcrumbs skeleton */}
      <div className='flex items-center gap-2'>
        <Skeleton className='h-4 w-12' />
        <Skeleton className='h-4 w-4' />
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-4 w-4' />
        <Skeleton className='h-4 w-32' />
      </div>

      {/* Table skeleton */}
      <SimpleDataTableSkeleton
        columnCount={5}
        rowCount={10}
        cellWidths={['50px', '250px', '120px', '180px', '100px']}
      />
    </div>
  );
}
