'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQueryState, parseAsString } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Combobox } from '@/components/ui/combobox';
import { MultiSelect } from '@/components/ui/multi-select';
import { X, Search } from 'lucide-react';
import { getWells } from '@/features/dashboards/substance/data/get-wells';
import { getSubstances } from '@/features/dashboards/substance/data/get-substances';
import { resolveActionResult } from '@/lib/actions/client';
import { parseISO } from 'date-fns';
import { useTransitionContext } from '@/hooks/use-transition-context';

interface LocalFilters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  substance: string | null;
  wells: string[];
}

export function CorrelationsFilters() {
  const t = useTranslations('dashboard.correlations');
  const locale = useLocale();
  const { startTransition, isLoading } = useTransitionContext();

  const [dateFrom, setDateFrom] = useQueryState(
    'dateFrom',
    parseAsString.withOptions({ shallow: false, startTransition })
  );
  const [dateTo, setDateTo] = useQueryState(
    'dateTo',
    parseAsString.withOptions({ shallow: false, startTransition })
  );
  const [substance, setSubstance] = useQueryState(
    'substance',
    parseAsString.withOptions({ shallow: false, startTransition })
  );
  const [wells, setWells] = useQueryState(
    'wells',
    parseAsString.withOptions({ shallow: false, startTransition })
  );

  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    dateFrom: dateFrom ? parseISO(dateFrom) : undefined,
    dateTo: dateTo ? parseISO(dateTo) : undefined,
    substance,
    wells: wells ? wells.split(',') : []
  });

  const { data: wellsData = [], isLoading: isLoadingWells } = useQuery({
    queryKey: ['wells'],
    queryFn: () => resolveActionResult(getWells({ area: undefined }))
  });

  const { data: substances = [], isLoading: isLoadingSubstances } = useQuery({
    queryKey: ['substances', locale],
    queryFn: () => resolveActionResult(getSubstances())
  });

  async function handleSearch() {
    await Promise.all([
      setDateFrom(localFilters.dateFrom?.toISOString() || null),
      setDateTo(localFilters.dateTo?.toISOString() || null),
      setSubstance(localFilters.substance),
      setWells(
        localFilters.wells.length > 0 ? localFilters.wells.join(',') : null
      )
    ]);
  }

  function handleReset() {
    setLocalFilters({
      dateFrom: undefined,
      dateTo: undefined,
      substance: null,
      wells: []
    });
    setDateFrom(null);
    setDateTo(null);
    setSubstance(null);
    setWells(null);
  }

  const hasActiveFilters = dateFrom || dateTo || substance || wells;

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2'>
        <Label className='text-sm font-medium'>{t('filterDateFrom')}</Label>
        <DatePicker
          value={localFilters.dateFrom}
          onChange={(date) =>
            setLocalFilters((prev) => ({ ...prev, dateFrom: date }))
          }
          placeholder={t('filterDateFrom')}
          className='h-9'
        />
      </div>
      <div className='flex flex-col gap-2'>
        <Label className='text-sm font-medium'>{t('filterDateTo')}</Label>
        <DatePicker
          value={localFilters.dateTo}
          onChange={(date) =>
            setLocalFilters((prev) => ({ ...prev, dateTo: date }))
          }
          placeholder={t('filterDateTo')}
          className='h-9'
        />
      </div>

      <div className='flex flex-col gap-2'>
        <Label className='text-sm font-medium'>{t('filterSubstance')}</Label>
        <Combobox
          value={localFilters.substance}
          onValueChange={(value) =>
            setLocalFilters((prev) => ({ ...prev, substance: value }))
          }
          options={substances}
          isLoading={isLoadingSubstances}
          placeholder={t('filterSubstancePlaceholder')}
          searchPlaceholder={t('search')}
          emptyMessage={t('noDataLabel')}
          className='h-9'
        />
      </div>

      <div className='flex flex-col gap-2'>
        <Label className='text-sm font-medium'>{t('filterWells')}</Label>
        <MultiSelect
          values={localFilters.wells}
          onValuesChange={(values) =>
            setLocalFilters((prev) => ({ ...prev, wells: values }))
          }
          options={wellsData.map((w) => ({ value: w.value, label: w.label }))}
          placeholder={t('filterWellsPlaceholder')}
          searchPlaceholder={t('search')}
          isLoading={isLoadingWells}
          className='h-9'
        />
      </div>

      <Button
        onClick={handleSearch}
        disabled={isLoading}
        className='h-9 w-full'
      >
        <Search data-icon='inline-start' />
        {t('search')}
      </Button>

      {hasActiveFilters ? (
        <Button variant='outline' onClick={handleReset} className='h-9 w-full'>
          <X data-icon='inline-start' />
          {t('clearFilters')}
        </Button>
      ) : null}
    </div>
  );
}
