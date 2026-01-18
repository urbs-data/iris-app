'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { useQueryState } from 'nuqs';
import { useTranslations } from 'next-intl';
import { createSearchColumns } from './columns';
import type { Document, Pagination } from '../../types';
import { searchParams } from '../../searchparams';

interface SearchTableProps {
  data: Document[];
  pagination?: Pagination;
}

export function SearchTable({ data, pagination }: SearchTableProps) {
  const t = useTranslations('search');
  const [pageSize] = useQueryState(
    'perPage',
    searchParams.perPage.withOptions({
      shallow: false
    })
  );

  const pageCount = pagination
    ? pagination.total_pages
    : Math.ceil(data.length / pageSize);

  const columns = createSearchColumns({
    pagination,
    translations: {
      title: t('table.title'),
      pageNumber: t('table.pageNumber'),
      relevance: t('table.relevance')
    }
  });

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500
  });

  return (
    <DataTable table={table} totalItems={pagination?.total_documents ?? 0} />
  );
}
