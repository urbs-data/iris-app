'use client';

import { useTranslations } from 'next-intl';
import { SectionError } from '@/components/ui/section-error';

export default function Error({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors.generalDashboard');

  return (
    <div className='flex h-full items-center justify-center p-4'>
      <SectionError title={t('title')} message={t('message')} reset={reset} />
    </div>
  );
}
