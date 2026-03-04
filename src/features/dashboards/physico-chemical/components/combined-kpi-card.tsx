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

interface CombinedKpiCardProps {
  title: string;
  highlightValue?: string | number;
  highlightUnit?: string;
  items: KpiItem[];
  className?: string;
}

export function CombinedKpiCard({
  title,
  highlightValue,
  highlightUnit,
  items,
  className
}: CombinedKpiCardProps) {
  return (
    <Card className={cn('flex flex-col gap-0 p-3', className)}>
      <div className='mb-2 flex items-baseline justify-between'>
        <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
          {title}
        </span>
      </div>

      {highlightValue !== undefined && (
        <div className='mb-2'>
          <span className='text-2xl font-bold tabular-nums'>
            {highlightValue}
          </span>
          {highlightUnit && (
            <span className='text-muted-foreground ml-1 text-sm font-normal'>
              {highlightUnit}
            </span>
          )}
        </div>
      )}

      <div className='flex flex-row items-center gap-0 divide-x'>
        {items.map((item, index) => (
          <div
            key={index}
            className='flex flex-1 flex-col items-center justify-center px-2 text-center'
          >
            <span className='text-muted-foreground text-xs font-medium'>
              {item.label}
            </span>
            <span
              className={cn('text-sm font-bold tabular-nums', item.className)}
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

interface CombinedKpiCardSkeletonProps {
  itemCount?: number;
  className?: string;
}

export function CombinedKpiCardSkeleton({
  itemCount = 4,
  className
}: CombinedKpiCardSkeletonProps) {
  return (
    <Card className={cn('flex flex-col gap-0 p-3', className)}>
      <Skeleton className='mb-2 h-3 w-32' />
      <Skeleton className='mb-2 h-7 w-20' />
      <div className='flex flex-row items-center divide-x'>
        {Array.from({ length: itemCount }).map((_, index) => (
          <div
            key={index}
            className='flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1'
          >
            <Skeleton className='h-3 w-12' />
            <Skeleton className='h-4 w-14' />
          </div>
        ))}
      </div>
    </Card>
  );
}
