'use client';

import { FileItem } from '../lib/types';
import { createFileListColumns } from './file-list-columns';
import { SimpleDataTable } from '@/components/ui/table/simple-data-table';
import { useTranslations } from 'next-intl';

interface FileListProps {
  files: FileItem[];
  currentPath: string;
}

export function FileList({ files, currentPath }: FileListProps) {
  const t = useTranslations('explorer');
  const columns = createFileListColumns(currentPath);

  return (
    <SimpleDataTable
      columns={columns}
      data={files}
      pageSize={20}
      emptyMessage={t('emptyFolder')}
    />
  );
}
