'use client';

import { ColumnDef } from '@tanstack/react-table';
import { FileIcon } from '@/features/shared/components/file-icon';
import { RelevanceStars } from '@/features/shared/components/relevance-stars';
import { MetadataBadges } from '@/features/shared/components/metadata-badges';
import { DownloadButton } from '@/features/shared/components/download-button';
import type { Document, Pagination } from '../../types';

interface ColumnsOptions {
  pagination?: Pagination;
  translations: {
    title: string;
    pageNumber: string;
    relevance: string;
  };
}

export function createSearchColumns(
  options: ColumnsOptions
): ColumnDef<Document>[] {
  const { pagination, translations } = options;

  return [
    {
      id: 'index',
      header: '',
      cell: ({ row }) => {
        const globalIndex = pagination
          ? (pagination.page_number - 1) * pagination.page_size + row.index + 1
          : row.index + 1;
        return (
          <div className='text-muted-foreground w-8 text-center text-xs'>
            {globalIndex}
          </div>
        );
      },
      size: 20
    },
    {
      id: 'fileType',
      header: '',
      cell: ({ row }) => (
        <div className='flex items-center'>
          <FileIcon filename={row.original.sourcefile} />
        </div>
      ),
      size: 20
    },
    {
      accessorKey: 'sourcefile',
      header: translations.title,
      cell: ({ row }) => (
        <div className='max-w-[200px] truncate font-medium sm:max-w-[300px]'>
          {row.original.sourcefile}
        </div>
      ),
      size: 20
    },
    {
      id: 'pagenumber',
      header: translations.pageNumber,
      cell: ({ row }) => {
        return (
          <div className='text-muted-foreground text-center text-sm'>
            {row.original.sourcepage ?? '-'}
          </div>
        );
      },
      size: 20
    },
    {
      id: 'relevance',
      header: translations.relevance,
      cell: ({ row }) => <RelevanceStars score={row.original.score} />
    },
    {
      id: 'metadata',
      header: 'Metadata',
      cell: ({ row }) => (
        <MetadataBadges
          year={row.original.year}
          classification={row.original.classification}
          subClassification={row.original.subClassification}
        />
      ),
      size: 20
    },
    {
      id: 'feedback',
      header: '',
      cell: () => null,
      size: 20
    },
    {
      id: 'download',
      header: '',
      cell: ({ row }) => {
        return (
          <div className='flex justify-center'>
            <DownloadButton
              blobPath={row.original.storageUrl}
              page={row.original.sourcepage ?? undefined}
            />
          </div>
        );
      },
      size: 20
    }
  ];
}
