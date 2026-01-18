'use client';

import { useTranslations } from 'next-intl';
import { ValidationStatus, statusConfig } from './status-badge';

interface NoResultsProps {
  status: ValidationStatus;
}

export function NoResults({ status }: NoResultsProps) {
  const t = useTranslations('validation');

  return (
    <div className='rounded-md border bg-gray-50 py-8 text-center'>
      {t('results.noResults', { status: t(statusConfig[status].labelKey) })}
    </div>
  );
}
