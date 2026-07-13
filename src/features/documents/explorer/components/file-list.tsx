'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileItem } from '../lib/types';
import { createFileListColumns } from './file-list-columns';
import { SimpleDataTable } from '@/components/ui/table/simple-data-table';
import { useTranslations } from 'next-intl';
import { BulkDeleteButton } from './bulk-delete-button';

interface FileListProps {
  files: FileItem[];
  currentPath: string;
}

export function FileList({ files, currentPath }: FileListProps) {
  const t = useTranslations('fileExplorer');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectableIds = useMemo(
    () => files.filter((f) => f.type === 'file').map((f) => f.id),
    [files]
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(selectableIds);
      const next = new Set<string>();
      prev.forEach((id) => {
        if (valid.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [selectableIds]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === selectableIds.length && selectableIds.length > 0) {
        return new Set();
      }
      return new Set(selectableIds);
    });
  };

  const allSelected =
    selectableIds.length > 0 && selectedIds.size === selectableIds.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const columns = createFileListColumns(currentPath, {
    selectedIds,
    toggleId,
    toggleAll,
    allSelected,
    someSelected,
    hasSelectable: selectableIds.length > 0
  });

  return (
    <div className='flex flex-1 flex-col gap-3'>
      {selectedIds.size > 0 && (
        <div className='bg-muted/50 flex items-center justify-between rounded-md border px-3 py-2'>
          <span className='text-muted-foreground text-sm'>
            {selectedIds.size} archivo(s) seleccionado(s)
          </span>
          <BulkDeleteButton
            blobPaths={Array.from(selectedIds)}
            onComplete={() => setSelectedIds(new Set())}
          />
        </div>
      )}
      <SimpleDataTable
        columns={columns}
        data={files}
        pageSize={30}
        emptyMessage={t('emptyFolder')}
      />
    </div>
  );
}
