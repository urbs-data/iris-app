'use client';

import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ResultsTableProps {
  datos: Record<string, unknown>[];
}

export function ResultsTable({ datos }: ResultsTableProps) {
  if (!datos.length) return null;

  const headers = Object.keys(datos[0]);

  return (
    <Card className='mt-2 border-gray-200 py-0'>
      <div className='max-h-[250px] overflow-auto'>
        <ScrollArea className='w-full'>
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((key) => (
                  <TableHead key={key}>{key}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {datos.map((dato, i) => (
                <TableRow key={i}>
                  {Object.values(dato).map((value, j) => (
                    <TableCell key={j}>{String(value ?? '')}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>
      </div>
    </Card>
  );
}
