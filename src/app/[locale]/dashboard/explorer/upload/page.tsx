import { getTranslations } from 'next-intl/server';
import PageContainer from '@/components/layout/page-container';
import { UploadDocumentsForm } from '@/features/documents/explorer/components/upload-documents-form';
import { uploadInfoContentEs, uploadInfoContentEn } from '@/config/infoconfig';

export const metadata = {
  title: 'Dashboard: Cargar Documentos'
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function UploadDocumentsPage(props: PageProps) {
  const { locale } = await props.params;
  const t = await getTranslations('uploadDocument');

  const infoContent =
    locale === 'en' ? uploadInfoContentEn : uploadInfoContentEs;

  return (
    <PageContainer scrollable pageTitle={t('title')} infoContent={infoContent}>
      <UploadDocumentsForm />
    </PageContainer>
  );
}
