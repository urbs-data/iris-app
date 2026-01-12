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
  className?: string;
}

export function KpiCard({ items, className }: KpiCardProps) {
  return (
    <Card
      className={cn('flex flex-row items-center gap-0 divide-x', className)}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className='flex flex-1 flex-col items-center justify-center px-2 text-center'
        >
          <span className='text-muted-foreground text-xs font-medium'>
            {item.label}
          </span>
          <span
            className={cn(
              'text-lg font-bold tabular-nums md:text-xl',
              item.className
            )}
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
