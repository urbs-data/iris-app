import { getTranslations } from 'next-intl/server';
import { resolveActionResult } from '@/lib/actions/client';
import { getCorrelations } from '../data/get-correlations';
import { CorrelationCard } from './correlation-card';
import { CorrelationMatrix } from './correlation-matrix';
import { LoeCard } from './loe-card';

const LOE_TITLE_KEYS = [
  'loe1Title',
  'loe2Title',
  'loe3Title',
  'loe4Title'
] as const;
const STATUS_LABEL_KEYS: Record<string, string> = {
  cumplido: 'statusCumplido',
  parcial: 'statusParcial',
  no_cumplido: 'statusNoCumplido',
  no_evaluable: 'statusNoEval',
  cumple: 'statusCumple',
  excede: 'statusExcede'
};

interface CorrelationsDashboardProps {
  substance: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  area?: string | null;
  wells?: string | null;
}

export async function CorrelationsDashboard({
  substance,
  dateFrom,
  dateTo,
  area,
  wells
}: CorrelationsDashboardProps) {
  const t = await getTranslations('dashboard.correlations');
  const wellsArray = wells ? wells.split(',').filter(Boolean) : [];

  const result = await resolveActionResult(
    getCorrelations({
      substance,
      dateFrom: dateFrom ?? undefined,
      dateTo: dateTo ?? undefined,
      area: area ?? undefined,
      wells: wellsArray
    })
  );

  if (result.data.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center rounded-xl border border-dashed p-12'>
        <p className='text-muted-foreground text-sm'>{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className='flex flex-1 gap-4'>
      <div className='flex min-w-0 flex-1 flex-col gap-4'>
        <section className='flex flex-col gap-3'>
          <p className='text-foreground text-sm font-bold tracking-wide uppercase'>
            {t('correlationsWith', { substance: result.substance })}
          </p>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
            {result.data.map((param) => (
              <CorrelationCard key={param.name} parameter={param} />
            ))}
          </div>
        </section>

        <section className='flex flex-col gap-3'>
          <p className='text-foreground text-sm font-bold tracking-wide uppercase'>
            {t('matrixTitle')}
          </p>
          <CorrelationMatrix
            substanceName={result.substance}
            data={result.data}
            matrix={result.matrix}
          />
        </section>
      </div>

      <aside className='flex w-72 shrink-0 flex-col gap-3'>
        <div className='flex flex-col gap-1'>
          <p className='text-foreground text-sm font-bold tracking-wide uppercase'>
            {t('loeTitle')}
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          {result.loeAnalyses.map((analysis, i) => (
            <LoeCard
              key={i}
              loeNumber={i + 1}
              analysis={analysis}
              title={t(LOE_TITLE_KEYS[i])}
              statusLabel={t(STATUS_LABEL_KEYS[analysis.status])}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
