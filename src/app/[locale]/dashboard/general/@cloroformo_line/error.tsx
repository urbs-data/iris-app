'use client';

import { useTranslations } from 'next-intl';
import { SectionError } from '@/components/ui/section-error';

export default function Error({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors.generalChart');

  return (
    <SectionError
      title={t('title')}
      message={t('cloroformoMessage')}
      reset={reset}
    />
  );
}
