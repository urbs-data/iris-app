import { ValidationForm } from '@/features/documents/validation/components/validation-form';
import PageContainer from '@/components/layout/page-container';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Dashboard: Validación de Documentos'
};

export default async function ValidatePage() {
  const t = await getTranslations('validation');
  return (
    <PageContainer scrollable pageTitle={t('title')}>
      <ValidationForm />
    </PageContainer>
  );
}
