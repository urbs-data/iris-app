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
import { getFqParameters } from '@/features/dashboards/physico-chemical/data/get-fq-parameters';
import { FQ_DEFAULTS } from '@/features/dashboards/physico-chemical/types';
import { resolveActionResult } from '@/lib/actions/client';
import { parseISO } from 'date-fns';
import { useTransitionContext } from '@/hooks/use-transition-context';

interface LocalFilters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  substance: string | null;
  parametro: string | null;
  wells: string[];
}

export function PhysicoChemicalFilters() {
  const t = useTranslations('substance');
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
  const [parametro, setParametro] = useQueryState(
    'parametro',
    parseAsString.withOptions({ shallow: false, startTransition })
  );
  const [wells, setWells] = useQueryState(
    'wells',
    parseAsString.withOptions({ shallow: false, startTransition })
  );

  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    dateFrom: dateFrom ? parseISO(dateFrom) : undefined,
    dateTo: dateTo ? parseISO(dateTo) : undefined,
    substance: substance ?? null,
    parametro: parametro ?? null,
    wells: wells ? wells.split(',') : []
  });

  const { data: wellsData = [], isLoading: isLoadingWells } = useQuery({
    queryKey: ['wells'],
    queryFn: () => resolveActionResult(getWells({}))
  });

  const { data: substances = [], isLoading: isLoadingSubstances } = useQuery({
    queryKey: ['substances', locale],
    queryFn: () => resolveActionResult(getSubstances())
  });

  const { data: fqParameters = [], isLoading: isLoadingParameters } = useQuery({
    queryKey: ['fqParameters', locale],
    queryFn: () => resolveActionResult(getFqParameters({}))
  });

  async function handleSearch() {
    await Promise.all([
      setDateFrom(localFilters.dateFrom?.toISOString() || null),
      setDateTo(localFilters.dateTo?.toISOString() || null),
      setSubstance(localFilters.substance || null),
      setParametro(localFilters.parametro || null),
      setWells(
        localFilters.wells.length > 0 ? localFilters.wells.join(',') : null
      )
    ]);
  }

  function handleResetFilters() {
    setLocalFilters({
      dateFrom: parseISO(FQ_DEFAULTS.dateFrom),
      dateTo: new Date(),
      substance: null,
      parametro: null,
      wells: []
    });

    setDateFrom(null);
    setDateTo(null);
    setSubstance(null);
    setParametro(null);
    setWells(null);
  }

  const hasActiveFilters =
    dateFrom || dateTo || substance || parametro || wells;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label className='text-sm font-medium'>{t('dateFrom')}</Label>
        <DatePicker
          minDate={new Date(2019, 0, 1)}
          value={localFilters.dateFrom}
          onChange={(date) =>
            setLocalFilters((prev) => ({ ...prev, dateFrom: date }))
          }
          placeholder={t('dateFrom')}
          className='h-9'
        />
      </div>
      <div className='space-y-2'>
        <Label className='text-sm font-medium'>{t('dateTo')}</Label>
        <DatePicker
          minDate={new Date(2019, 0, 1)}
          value={localFilters.dateTo}
          onChange={(date) =>
            setLocalFilters((prev) => ({ ...prev, dateTo: date }))
          }
          placeholder={t('dateTo')}
          className='h-9'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-sm font-medium'>{t('wells')}</Label>
        <MultiSelect
          values={localFilters.wells}
          onValuesChange={(values) =>
            setLocalFilters((prev) => ({ ...prev, wells: values }))
          }
          options={wellsData.map((w) => ({ value: w.value, label: w.label }))}
          placeholder={t('wells')}
          searchPlaceholder={t('searchWell')}
          isLoading={isLoadingWells}
          className='h-9'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-sm font-medium'>{t('substance')}</Label>
        <Combobox
          value={localFilters.substance}
          onValueChange={(value) =>
            setLocalFilters((prev) => ({ ...prev, substance: value }))
          }
          options={substances}
          isLoading={isLoadingSubstances}
          placeholder={t('substance')}
          searchPlaceholder={t('searchSubstance')}
          emptyMessage={t('noSubstanceFound')}
          className='h-9'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-sm font-medium'>{t('fqParameter')}</Label>
        <Combobox
          value={localFilters.parametro}
          onValueChange={(value) =>
            setLocalFilters((prev) => ({ ...prev, parametro: value }))
          }
          options={fqParameters}
          isLoading={isLoadingParameters}
          placeholder={t('fqParameter')}
          searchPlaceholder={t('searchFqParameter')}
          emptyMessage={t('noFqParameterFound')}
          className='h-9'
        />
      </div>

      <Button
        onClick={handleSearch}
        disabled={isLoading}
        className='h-9 w-full'
      >
        <Search className='mr-2 h-4 w-4' />
        {t('search')}
      </Button>

      {hasActiveFilters && (
        <Button
          variant='outline'
          onClick={handleResetFilters}
          className='h-9 w-full'
        >
          <X className='mr-2 h-4 w-4' />
          {t('clearFilters')}
        </Button>
      )}
    </div>
  );
}
