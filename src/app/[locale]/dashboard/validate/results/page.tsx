import PageContainer from '@/components/layout/page-container';
import { ValidationResultsContent } from '@/features/documents/validation/components/validation-results';
import { getTranslations } from 'next-intl/server';

import { titleMetadata } from '@/lib/page-metadata';
export const generateMetadata = titleMetadata('validation.results.title');

export default async function ResultsPage() {
  const t = await getTranslations('validation.results');
  return (
    <PageContainer scrollable pageTitle={t('title')}>
      <ValidationResultsContent />
    </PageContainer>
  );
}
