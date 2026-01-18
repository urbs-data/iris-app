import { Skeleton } from '@/components/ui/skeleton';

export function ValidationResultsSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-48' />
        <div className='flex items-center gap-2'>
          <Skeleton className='h-10 w-36' />
          <Skeleton className='h-10 w-32' />
        </div>
      </div>

      {/* Tabs */}
      <div className='mb-6 grid grid-cols-4 gap-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-10 w-full' />
        ))}
      </div>

      {/* Results */}
      <div className='space-y-6'>
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <div key={groupIndex} className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-48' />
            </div>
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, itemIndex) => (
                <Skeleton key={itemIndex} className='h-16 w-full rounded-md' />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
