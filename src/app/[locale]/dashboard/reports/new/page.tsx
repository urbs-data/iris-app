import PageContainer from '@/components/layout/page-container';
import { getTranslations } from 'next-intl/server';
import { ReportGenerator } from '@/features/reports/components/report-generator';
import {
  reportsGeneratorInfoContentEs,
  reportsGeneratorInfoContentEn
} from '@/config/infoconfig';

export const metadata = {
  title: 'Dashboard: New Report'
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewReportPage(props: PageProps) {
  const { locale } = await props.params;
  const t = await getTranslations('reports');

  const infoContent =
    locale === 'en'
      ? reportsGeneratorInfoContentEn
      : reportsGeneratorInfoContentEs;

  return (
    <PageContainer
      scrollable
      pageTitle={t('generator.title')}
      infoContent={infoContent}
    >
      <ReportGenerator />
    </PageContainer>
  );
}
