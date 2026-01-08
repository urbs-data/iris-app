import PageContainer from '@/components/layout/page-container';
import { FileExplorer } from '@/features/explorer/components/file-explorer';
import { FileExplorerSkeleton } from '@/features/explorer/components/file-explorer-skeleton';
import { searchParamsCache, serialize } from '@/features/explorer/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Dashboard: Explorador de Archivos'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const t = await getTranslations('explorer');

  searchParamsCache.parse(searchParams);

  const key = serialize({ ...searchParams });

  return (
    <PageContainer scrollable pageTitle={t('title')}>
      <Suspense key={key} fallback={<FileExplorerSkeleton />}>
        <FileExplorer />
      </Suspense>
    </PageContainer>
  );
}
