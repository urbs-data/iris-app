import { getTranslations } from 'next-intl/server';
import PageContainer from '@/components/layout/page-container';
import { UploadDocumentsForm } from '@/features/explorer/components/upload-documents-form';

export const metadata = {
  title: 'Dashboard: Cargar Documentos'
};

export default async function UploadDocumentsPage() {
  const t = await getTranslations('uploadDocument');

  return (
    <PageContainer scrollable pageTitle={t('title')}>
      <UploadDocumentsForm />
    </PageContainer>
  );
}
