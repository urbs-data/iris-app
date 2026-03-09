'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type {
  SpearmanMatrix,
  CorrelationParameter,
  ParameterName
} from '../types';

interface CorrelationMatrixProps {
  substanceName: string;
  data: CorrelationParameter[];
  matrix: SpearmanMatrix;
}

function getCellStyle(v: number): string {
  if (v === 1) return 'text-muted-foreground';
  if (v <= -0.7)
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (v <= -0.4)
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (v < 0) return 'text-green-600 dark:text-green-400';
  if (v >= 0.7)
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  if (v >= 0.4)
    return 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'text-muted-foreground';
}

function formatCell(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return '—';
  return v.toFixed(2);
}

export function CorrelationMatrix({
  substanceName,
  data,
  matrix
}: CorrelationMatrixProps) {
  const { paramNames, rows } = useMemo(() => {
    const substanceCorrelations = new Map(
      data.map((d) => [d.name, d.correlation])
    );

    const paramNamesFromMatrix = Object.keys(matrix) as ParameterName[];
    const paramNamesFromData = data.map((d) => d.name);

    const allParams = Array.from(
      new Set([...paramNamesFromMatrix, ...paramNamesFromData])
    );

    const colHeaders = [substanceName, ...allParams];

    const substanceRow: (number | undefined)[] = [
      1.0,
      ...allParams.map((p) => substanceCorrelations.get(p))
    ];

    const paramRows = allParams.map((rowParam) => {
      const rowValues: (number | undefined)[] = [
        substanceCorrelations.get(rowParam),
        ...allParams.map((colParam) => {
          if (rowParam === colParam) return 1.0;
          return matrix[rowParam as ParameterName]?.[colParam as ParameterName];
        })
      ];
      return { label: rowParam, values: rowValues };
    });

    return {
      paramNames: colHeaders,
      rows: [{ label: substanceName, values: substanceRow }, ...paramRows]
    };
  }, [substanceName, data, matrix]);

  if (rows.length === 0) return null;

  return (
    <div className='overflow-x-auto'>
      <table className='w-full border-collapse text-sm'>
        <thead>
          <tr>
            <th className='bg-muted/40 text-muted-foreground border-b px-2 py-2 text-left text-xs font-semibold' />
            {paramNames.map((name) => (
              <th
                key={name}
                className='bg-muted/40 text-muted-foreground border-b px-2 py-2 text-center text-xs font-semibold'
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, values }) => (
            <tr key={label} className='border-border/50 border-b last:border-0'>
              <td className='text-muted-foreground px-2 py-2 text-xs font-medium'>
                {label}
              </td>
              {values.map((v, i) => {
                const isDiagonal =
                  paramNames[i + 1] === label ||
                  (i === 0 && label === paramNames[0]);
                return (
                  <td
                    key={i}
                    className={cn(
                      'px-2 py-2 text-center text-xs font-semibold tabular-nums',
                      v !== undefined && !Number.isNaN(v)
                        ? getCellStyle(v)
                        : 'text-muted-foreground/40',
                      isDiagonal && 'opacity-40'
                    )}
                  >
                    {formatCell(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
