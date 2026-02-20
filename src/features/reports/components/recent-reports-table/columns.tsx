'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { RecentExport } from '../../lib/types';
import { DownloadButton } from '@/features/shared/components/download-button';

interface ColumnsOptions {
  translations: {
    name: string;
    generatedAt: string;
    range: string;
    user: string;
    action: string;
  };
}

export function createRecentReportsColumns(
  options: ColumnsOptions
): ColumnDef<RecentExport>[] {
  const { translations } = options;

  return [
    {
      accessorKey: 'name',
      header: translations.name,
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.name}</span>
      ),
      size: 10
    },
    {
      accessorKey: 'generatedAt',
      header: translations.generatedAt,
      size: 10
    },
    {
      accessorKey: 'range',
      header: translations.range,
      size: 10
    },
    {
      accessorKey: 'user',
      header: translations.user,
      size: 10
    },
    {
      id: 'download',
      header: '',
      cell: ({ row }) => {
        return (
          <div className='flex justify-center'>
            <DownloadButton blobPath={row.original.urlReport} />
          </div>
        );
      },
      size: 20
    }
  ];
}
