import Link from 'next/link';
import { Suspense } from 'react';
import { SearchParams } from 'nuqs/server';
import { getTranslations } from 'next-intl/server';
import { IconPlus } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { FileExplorer } from '@/features/documents/explorer/components/file-explorer';
import { FileExplorerSkeleton } from '@/features/documents/explorer/components/file-explorer-skeleton';
import {
  searchParamsCache,
  serialize
} from '@/features/documents/explorer/searchparams';
import { cn } from '@/lib/utils';
import {
  explorerInfoContentEs,
  explorerInfoContentEn
} from '@/config/infoconfig';

export const metadata = {
  title: 'Dashboard: Explorador de Archivos'
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const { locale } = await props.params;
  const t = await getTranslations('fileExplorer');

  searchParamsCache.parse(searchParams);

  const key = serialize({ ...searchParams });

  const infoContent =
    locale === 'en' ? explorerInfoContentEn : explorerInfoContentEs;

  return (
    <PageContainer
      scrollable={false}
      pageTitle={t('title')}
      infoContent={infoContent}
      pageHeaderAction={
        <Link
          href='/dashboard/explorer/upload'
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <IconPlus className='mr-2 h-4 w-4' /> {t('upload')}
        </Link>
      }
    >
      <Suspense key={key} fallback={<FileExplorerSkeleton />}>
        <FileExplorer />
      </Suspense>
    </PageContainer>
  );
}
