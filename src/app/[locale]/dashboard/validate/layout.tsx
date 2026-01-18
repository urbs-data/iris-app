import { ValidationProvider } from '@/features/documents/validation/context/validation-context';
import PageContainer from '@/components/layout/page-container';
import { getTranslations } from 'next-intl/server';

export default async function ValidateLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('validation');

  return (
    <PageContainer scrollable pageTitle={t('title')}>
      <ValidationProvider>{children}</ValidationProvider>
    </PageContainer>
  );
}
