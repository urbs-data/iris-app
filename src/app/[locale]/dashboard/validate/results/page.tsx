import PageContainer from '@/components/layout/page-container';
import { ValidationResultsContent } from '@/features/documents/validation/components/validation-results';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Dashboard: Resultados de Validación'
};

export default async function ResultsPage() {
  const t = await getTranslations('validation.results');
  return (
    <PageContainer scrollable pageTitle={t('title')}>
      <ValidationResultsContent />
    </PageContainer>
  );
}
