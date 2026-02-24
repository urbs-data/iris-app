import PageContainer from '@/components/layout/page-container';
import { getTranslations } from 'next-intl/server';
import { ReportGenerator } from '@/features/reports/components/report-generator';

export const metadata = {
  title: 'Dashboard: New Report'
};

export default async function NewReportPage() {
  const t = await getTranslations('reports');

  return (
    <PageContainer scrollable pageTitle={t('generator.title')}>
      <ReportGenerator />
    </PageContainer>
  );
}
