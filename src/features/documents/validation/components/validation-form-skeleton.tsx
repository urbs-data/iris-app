import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ValidationFormSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='pb-3'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-5' />
                <Skeleton className='h-5 w-32' />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className='h-52 w-full' />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='flex justify-center'>
        <Skeleton className='h-11 w-48' />
      </div>
    </div>
  );
}
