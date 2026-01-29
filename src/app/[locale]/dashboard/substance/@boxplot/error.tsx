'use client';

import { useTranslations } from 'next-intl';
import { SectionError } from '@/components/ui/section-error';

export default function Error() {
  const t = useTranslations('errors');

  return <SectionError message={t('boxplotError')} />;
}
