import { Card } from '@/components/ui/card';
import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <Card
      className={cn(
        'flex h-full w-full flex-col items-center justify-center p-8',
        className
      )}
    >
      <div className='flex flex-col items-center gap-4 text-center'>
        <div className='bg-muted rounded-full p-4'>
          <FileQuestion className='text-muted-foreground h-8 w-8' />
        </div>
        {title && (
          <h3 className='text-foreground text-lg font-semibold'>{title}</h3>
        )}
        {description && (
          <p className='text-muted-foreground max-w-md text-sm'>
            {description}
          </p>
        )}
      </div>
    </Card>
  );
}
