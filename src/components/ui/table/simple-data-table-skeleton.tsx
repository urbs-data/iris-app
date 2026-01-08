'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface SimpleDataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  cellWidths?: string[];
}

export function SimpleDataTableSkeleton({
  columnCount = 5,
  rowCount = 5,
  cellWidths = ['auto']
}: SimpleDataTableSkeletonProps) {
  const effectiveCellWidths = Array.from(
    { length: columnCount },
    (_, index) => cellWidths[index % cellWidths.length] ?? 'auto'
  );

  return (
    <div className='flex flex-col gap-4'>
      {/* Table skeleton with horizontal scroll on mobile */}
      <div className='w-full overflow-x-auto rounded-lg border'>
        <table
          className='w-full caption-bottom text-sm'
          style={{ minWidth: 'max-content' }}
        >
          <TableHeader className='bg-background'>
            <TableRow className='bg-muted hover:bg-muted border-b'>
              {Array.from({ length: columnCount }).map((_, j) => (
                <TableHead
                  key={j}
                  className='bg-muted'
                  style={{
                    width: effectiveCellWidths[j],
                    minWidth:
                      effectiveCellWidths[j] === 'auto'
                        ? 'auto'
                        : effectiveCellWidths[j]
                  }}
                >
                  <Skeleton className='h-6 w-full' />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, i) => (
              <TableRow key={i} className='hover:bg-transparent'>
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableCell
                    key={j}
                    style={{
                      width: effectiveCellWidths[j],
                      minWidth:
                        effectiveCellWidths[j] === 'auto'
                          ? 'auto'
                          : effectiveCellWidths[j]
                    }}
                  >
                    <Skeleton className='h-6 w-full' />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>

      {/* Pagination skeleton - Mobile first: stack on small screens */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0'>
        <Skeleton className='h-5 w-32' />
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:gap-6'>
          {/* Rows per page - hide on mobile, show on tablet+ */}
          <div className='hidden items-center space-x-2 sm:flex'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-8 w-[70px]' />
          </div>
          <Skeleton className='h-5 w-24' />
          <div className='flex items-center justify-center space-x-2'>
            <Skeleton className='hidden h-8 w-8 lg:block' />
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
            <Skeleton className='hidden h-8 w-8 lg:block' />
          </div>
        </div>
      </div>
    </div>
  );
}
