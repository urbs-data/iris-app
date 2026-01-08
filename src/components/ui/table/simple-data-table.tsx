'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight
} from '@tabler/icons-react';

interface SimpleDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  emptyMessage?: string;
}

export function SimpleDataTable<TData, TValue>({
  columns,
  data,
  pageSize = 15,
  emptyMessage = 'No hay resultados.'
}: SimpleDataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize
      }
    }
  });

  return (
    <div className='flex flex-col gap-4'>
      {/* Table with horizontal scroll on mobile */}
      <div className='w-full overflow-x-auto rounded-lg border'>
        <table
          className='w-full caption-bottom text-sm'
          style={{ minWidth: 'max-content' }}
        >
          <TableHeader className='bg-background'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className='bg-muted hover:bg-muted border-b'
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className='bg-muted'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>

      {/* Pagination - Mobile first: stack on small screens */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0'>
        <div className='text-muted-foreground text-sm'>
          {table.getFilteredRowModel().rows.length} registro(s) en total.
        </div>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:gap-6'>
          {/* Rows per page - hide on mobile, show on tablet+ */}
          <div className='hidden items-center space-x-2 sm:flex'>
            <p className='text-sm font-medium'>Registros por página</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className='h-8 w-[70px]'>
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side='top'>
                {[5, 15, 30, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page info */}
          <div className='flex items-center justify-center text-sm font-medium'>
            Página {table.getState().pagination.pageIndex + 1} de{' '}
            {table.getPageCount()}
          </div>

          {/* Navigation buttons */}
          <div className='flex items-center justify-center space-x-2'>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>Ir a la primera página</span>
              <IconChevronsLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>Ir a la página anterior</span>
              <IconChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>Ir a la página siguiente</span>
              <IconChevronRight className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>Ir a la última página</span>
              <IconChevronsRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
