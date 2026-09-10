import { getTranslations } from 'next-intl/server';
import PageContainer from '@/components/layout/page-container';
import { MetabaseEmbed } from '@/features/dashboards/quarterly/components/metabase-embed';

import { titleMetadata } from '@/lib/page-metadata';
export const generateMetadata = titleMetadata('nav.dashboard-quarterly');

export default async function QuarterlyPage() {
  const t = await getTranslations('nav');

  return (
    <PageContainer scrollable={false} pageTitle={t('dashboard-quarterly')}>
      <MetabaseEmbed />
    </PageContainer>
  );
}
