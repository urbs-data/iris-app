'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations('errors');

  return (
    <div className='flex h-full items-center justify-center p-4'>
      <Card className='flex flex-col items-center gap-4 p-6'>
        <h2 className='text-lg font-semibold'>{t('somethingWentWrong')}</h2>
        <p className='text-muted-foreground text-sm'>
          {t('substanceDashboardError')}
        </p>
        <Button onClick={reset}>{t('tryAgain')}</Button>
      </Card>
    </div>
  );
}
