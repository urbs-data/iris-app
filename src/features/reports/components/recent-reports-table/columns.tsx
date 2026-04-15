'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { RecentExport } from '../../lib/types';
import { DownloadButton } from '@/features/shared/components/download-button';
import { GenerateAiPdfButton } from './generate-ai-pdf-button';

interface ColumnsOptions {
  translations: {
    name: string;
    generatedAt: string;
    range: string;
    user: string;
    action: string;
    aiPdf: {
      buttonLabel: string;
      progressStart: string;
      progressRunning: string;
      progressOpening: string;
      success: string;
      successReused: string;
      error: string;
    };
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
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        return (
          <div className='flex justify-center gap-2'>
            <GenerateAiPdfButton
              reportId={row.original.id}
              translations={translations.aiPdf}
            />
            <DownloadButton blobPath={row.original.urlReport} />
          </div>
        );
      },
      size: 20
    }
  ];
}
