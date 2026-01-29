'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SectionErrorProps {
  title?: string;
  message?: string;
  reset?: () => void;
}

export function SectionError({ title, message, reset }: SectionErrorProps) {
  const t = useTranslations('errors');

  const displayTitle = title || t('loadingData.title');
  const displayMessage = message || t('loadingData.message');

  return (
    <Card className='h-full py-0'>
      <CardContent className='flex h-full min-h-[120px] flex-col items-center justify-center gap-3 py-4 text-center'>
        <AlertCircle className='text-destructive h-8 w-8' />
        <div className='space-y-1'>
          <p className='text-sm font-medium'>{displayTitle}</p>
          <p className='text-muted-foreground text-xs'>{displayMessage}</p>
        </div>
        {reset && (
          <Button variant='outline' size='sm' onClick={reset}>
            <RefreshCw className='mr-2 h-3 w-3' />
            {t('retry')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
