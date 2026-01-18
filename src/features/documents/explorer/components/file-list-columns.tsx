'use client';

import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { FileIcon } from '@/features/shared/components/file-icon';
import { FileItem } from '../lib/types';
import { serialize } from '../searchparams';
import { FileCellAction } from './file-cell-action';

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '-';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function createFileListColumns(
  currentPath: string
): ColumnDef<FileItem>[] {
  const t = useTranslations('fileExplorer');
  return [
    {
      accessorKey: 'type',
      header: t('columns.type'),
      cell: ({ row }) => {
        return (
          <div className='flex items-center'>
            <FileIcon filename={row.original.name} type={row.original.type} />
          </div>
        );
      }
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => {
        const file = row.original;
        const isFolder = file.type === 'folder';
        const newPath =
          currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;

        if (isFolder) {
          return (
            <Link
              href={`/dashboard/explorer${serialize({ path: newPath })}`}
              className={cn(
                'truncate font-medium text-blue-600 hover:text-blue-700'
              )}
            >
              {file.name}
            </Link>
          );
        }

        return <span className='truncate'>{file.name}</span>;
      }
    },
    {
      accessorKey: 'size',
      header: 'Tamaño',
      cell: ({ row }) => {
        return (
          <span className='text-muted-foreground text-sm'>
            {formatFileSize(row.original.size)}
          </span>
        );
      }
    },
    {
      accessorKey: 'uploadedBy',
      header: 'Subido por',
      cell: ({ row }) => {
        return (
          <span className='text-muted-foreground text-sm'>
            {row.original.uploadedBy}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const file = row.original;

        if (file.type === 'folder') return null;

        return <FileCellAction file={file} />;
      }
    }
  ];
}
