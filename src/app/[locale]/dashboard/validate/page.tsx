import { ValidationForm } from '@/features/documents/validation/components/validation-form';
import PageContainer from '@/components/layout/page-container';
import { getTranslations } from 'next-intl/server';

import { titleMetadata } from '@/lib/page-metadata';
export const generateMetadata = titleMetadata('validation.title');

export default async function ValidatePage() {
  const t = await getTranslations('validation');
  return (
    <PageContainer scrollable pageTitle={t('title')}>
      <ValidationForm />
    </PageContainer>
  );
}
