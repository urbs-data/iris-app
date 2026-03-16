import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { LOEAnalysis } from '../types';

type StatusVariant = 'cumplido' | 'parcial' | 'no_cumplido' | 'no_evaluable';

const STATUS_STYLES: Record<
  StatusVariant,
  { card: string; dot: string; badge: string }
> = {
  cumplido: {
    card: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40',
    dot: 'bg-green-500',
    badge:
      'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
  },
  parcial: {
    card: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40',
    dot: 'bg-amber-500',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
  },
  no_cumplido: {
    card: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
  },
  no_evaluable: {
    card: 'border-border bg-muted/30',
    dot: 'bg-muted-foreground/50',
    badge: 'bg-muted text-muted-foreground'
  }
};

function resolveVariant(status: string): StatusVariant {
  if (status === 'cumplido') return 'cumplido';
  if (status === 'parcial') return 'parcial';
  if (status === 'no_cumplido') return 'no_cumplido';
  if (status === 'cumple') return 'cumplido';
  if (status === 'excede') return 'no_cumplido';
  return 'no_evaluable';
}

interface LoeCardProps {
  loeNumber: number;
  analysis: LOEAnalysis;
  title: string;
  statusLabel: string;
}

export function LoeCard({
  loeNumber,
  analysis,
  title,
  statusLabel
}: LoeCardProps) {
  const variant = resolveVariant(analysis.status);
  const styles = STATUS_STYLES[variant];

  return (
    <div
      className={cn('flex flex-col gap-2 rounded-xl border p-4', styles.card)}
    >
      <div className='flex items-center gap-2'>
        <span className={cn('size-2.5 shrink-0 rounded-full', styles.dot)} />
        <span className='text-muted-foreground text-xs font-semibold'>
          LOE {loeNumber}
        </span>
        <Badge
          className={cn(
            'ml-auto h-5 rounded px-2 text-xs font-bold tracking-wide',
            styles.badge
          )}
        >
          {statusLabel}
        </Badge>
      </div>

      <p className='text-foreground text-sm font-semibold'>{title}</p>

      {analysis.text ? (
        <p className='text-muted-foreground text-xs leading-relaxed'>
          {analysis.text}
        </p>
      ) : null}
    </div>
  );
}
