'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiItem {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}

interface KpiCardProps {
  items: KpiItem[];
  title?: string;
  className?: string;
}

export function KpiCard({ items, title, className }: KpiCardProps) {
  return (
    <Card className={cn('flex flex-col gap-0', className)}>
      {title && (
        <div className='border-b px-3 py-1.5'>
          <span className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
            {title}
          </span>
        </div>
      )}
      <div className='flex flex-1 flex-row items-center divide-x'>
        {items.map((item, index) => (
          <div
            key={index}
            className='flex flex-1 flex-col items-center justify-center px-2 py-2 text-center'
          >
            <span className='text-muted-foreground text-xs font-medium'>
              {item.label}
            </span>
            <span
              className={cn('text-lg font-bold tabular-nums', item.className)}
            >
              {item.value}
              {item.unit && (
                <span className='text-muted-foreground ml-0.5 text-xs font-normal'>
                  {item.unit}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface KpiCardSkeletonProps {
  itemCount?: number;
  className?: string;
}

export function KpiCardSkeleton({
  itemCount = 6,
  className
}: KpiCardSkeletonProps) {
  return (
    <Card className={cn('flex flex-row items-center divide-x', className)}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <div
          key={index}
          className='flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3'
        >
          <Skeleton className='h-3 w-12' />
          <Skeleton className='h-6 w-16' />
        </div>
      ))}
    </Card>
  );
}
