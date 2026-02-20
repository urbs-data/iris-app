'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { useTranslations } from 'next-intl';
import { createRecentReportsColumns } from './columns';
import type { RecentExport } from '../../lib/types';

interface RecentReportsTableProps {
  data: RecentExport[];
  totalCount: number;
  pageCount: number;
}

export function RecentReportsTable({
  data,
  totalCount,
  pageCount
}: RecentReportsTableProps) {
  const t = useTranslations('reports.recent');

  const columns = createRecentReportsColumns({
    translations: {
      name: t('columns.name'),
      generatedAt: t('columns.generatedAt'),
      range: t('columns.range'),
      user: t('columns.user'),
      action: t('columns.action')
    }
  });

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500
  });

  return <DataTable table={table} totalItems={totalCount} />;
}
