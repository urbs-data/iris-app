'use client';

import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import {
  IconFolder,
  IconFile,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconFileTypeXls,
  IconPhoto,
  IconFileZip,
  IconFileText
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { DownloadButton } from '@/features/shared/components/download-button';
import { FileItem } from '../lib/types';
import { serialize } from '../searchparams';

function getFileIcon(file: FileItem) {
  if (file.type === 'folder') {
    return <IconFolder className='h-5 w-5 text-blue-500' />;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return <IconFileTypePdf className='h-5 w-5 text-red-500' />;
    case 'doc':
    case 'docx':
      return <IconFileTypeDocx className='h-5 w-5 text-blue-600' />;
    case 'xls':
    case 'xlsx':
      return <IconFileTypeXls className='h-5 w-5 text-green-600' />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return <IconPhoto className='h-5 w-5 text-purple-500' />;
    case 'zip':
    case 'rar':
    case '7z':
      return <IconFileZip className='h-5 w-5 text-amber-500' />;
    case 'txt':
    case 'csv':
      return <IconFileText className='h-5 w-5 text-gray-500' />;
    default:
      return <IconFile className='h-5 w-5 text-gray-500' />;
  }
}

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
          <div className='flex items-center'>{getFileIcon(row.original)}</div>
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

        return (
          <div className='flex justify-end'>
            <DownloadButton blobPath={file.id} />
          </div>
        );
      }
    }
  ];
}
