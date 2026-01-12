'use client';

import { Card } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export default function Error() {
  const t = useTranslations('errors');

  return (
    <Card className='flex h-full items-center justify-center p-4'>
      <p className='text-muted-foreground text-sm'>{t('mapError')}</p>
    </Card>
  );
}
