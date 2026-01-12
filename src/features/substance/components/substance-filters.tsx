'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryState } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Combobox } from '@/components/ui/combobox';
import type { DateRange } from 'react-day-picker';
import { X, Search } from 'lucide-react';
import { getSubstances } from '../data/get-substances';
import { getWells } from '../data/get-wells';
import { getAreas } from '../data/get-areas';
import { WellType, SampleType, SUBSTANCE_DEFAULTS } from '../types';
import { substanceSearchParams } from '../searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { parseISO } from 'date-fns';
import { useTransitionContext } from '@/hooks/use-transition-context';

interface LocalFilters {
  dateRange: DateRange | undefined;
  substance: string | null;
  wellType: WellType | null;
  area: string | null;
  well: string | null;
  sampleType: SampleType;
}

const WELL_TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: WellType.MONITORING, label: 'Monitoreo' },
  { value: WellType.PUMP, label: 'Bomba' }
];

const SAMPLE_TYPE_OPTIONS = [
  { value: SampleType.WATER, label: 'Agua' },
  { value: SampleType.SOIL, label: 'Suelo' }
];

export function SubstanceFilters() {
  const t = useTranslations('substance');
  const { startTransition, isLoading } = useTransitionContext();

  const [dateFrom, setDateFrom] = useQueryState(
    'dateFrom',
    substanceSearchParams.dateFrom.withOptions({
      shallow: false,
      startTransition
    })
  );
  const [dateTo, setDateTo] = useQueryState(
    'dateTo',
    substanceSearchParams.dateTo.withOptions({
      shallow: false,
      startTransition
    })
  );
  const [substance, setSubstance] = useQueryState(
    'substance',
    substanceSearchParams.substance.withOptions({
      shallow: false,
      startTransition
    })
  );
  const [wellType, setWellType] = useQueryState(
    'wellType',
    substanceSearchParams.wellType.withOptions({
      shallow: false,
      startTransition
    })
  );
  const [area, setArea] = useQueryState(
    'area',
    substanceSearchParams.area.withOptions({ shallow: false, startTransition })
  );
  const [well, setWell] = useQueryState(
    'well',
    substanceSearchParams.well.withOptions({ shallow: false, startTransition })
  );
  const [sampleType, setSampleType] = useQueryState(
    'sampleType',
    substanceSearchParams.sampleType.withOptions({
      shallow: false,
      startTransition
    })
  );

  const initialDateRange: DateRange | undefined =
    dateFrom || dateTo
      ? {
          from: dateFrom ? parseISO(dateFrom) : undefined,
          to: dateTo ? parseISO(dateTo) : undefined
        }
      : {
          from: parseISO(SUBSTANCE_DEFAULTS.dateFrom),
          to: new Date()
        };

  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    dateRange: initialDateRange,
    substance,
    wellType: wellType ?? null,
    area,
    well,
    sampleType
  });

  const { data: areas = [], isLoading: isLoadingAreas } = useQuery({
    queryKey: ['areas'],
    queryFn: () => resolveActionResult(getAreas())
  });

  const { data: wells = [], isLoading: isLoadingWells } = useQuery({
    queryKey: ['wells', localFilters.area],
    queryFn: () =>
      resolveActionResult(getWells({ area: localFilters.area || undefined }))
  });

  const { data: substances = [], isLoading: isLoadingSubstances } = useQuery({
    queryKey: ['substances'],
    queryFn: () => resolveActionResult(getSubstances())
  });

  async function handleSearch() {
    await Promise.all([
      setDateFrom(localFilters.dateRange?.from?.toISOString() || null),
      setDateTo(localFilters.dateRange?.to?.toISOString() || null),
      setSubstance(localFilters.substance),
      setWellType(localFilters.wellType || null),
      setArea(localFilters.area),
      setWell(localFilters.well),
      setSampleType(localFilters.sampleType)
    ]);
  }

  const handleResetFilters = (): void => {
    const defaultDateRange: DateRange = {
      from: parseISO(SUBSTANCE_DEFAULTS.dateFrom),
      to: new Date()
    };

    setLocalFilters({
      dateRange: defaultDateRange,
      substance: null,
      wellType: null,
      area: null,
      well: null,
      sampleType: SampleType.WATER
    });

    setDateFrom(null);
    setDateTo(null);
    setSubstance(null);
    setWellType(null);
    setArea(null);
    setWell(null);
    setSampleType(null);
  };

  const hasActiveFilters =
    dateFrom || dateTo || substance || wellType || area || well || sampleType;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label className='text-sm font-medium'>{t('dateRange')}</Label>
        <DateRangePicker
          value={localFilters.dateRange}
          onValueChange={(range) =>
            setLocalFilters((prev) => ({ ...prev, dateRange: range }))
          }
          placeholder={t('dateRange')}
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
        <Label className='text-sm font-medium'>{t('wellType')}</Label>
        <Combobox
          value={localFilters.wellType || 'all'}
          onValueChange={(value) =>
            setLocalFilters((prev) => ({
              ...prev,
              wellType: value === 'all' ? null : (value as WellType)
            }))
          }
          options={WELL_TYPE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label
          }))}
          placeholder={t('wellType')}
          searchPlaceholder={t('searchWellType')}
          emptyMessage={t('noWellTypeFound')}
          className='h-9'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-sm font-medium'>{t('area')}</Label>
        <Combobox
          value={localFilters.area}
          onValueChange={(value) =>
            setLocalFilters((prev) => ({
              ...prev,
              area: value === 'all' ? null : value,
              well: null
            }))
          }
          options={areas.map((a) => ({ value: a.value, label: a.label }))}
          placeholder={t('area')}
          searchPlaceholder={t('searchArea')}
          emptyMessage={t('noAreaFound')}
          isLoading={isLoadingAreas}
          className='h-9'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-sm font-medium'>{t('well')}</Label>
        <Combobox
          value={localFilters.well}
          onValueChange={(value) =>
            setLocalFilters((prev) => ({ ...prev, well: value }))
          }
          options={wells.map((w) => ({ value: w.value, label: w.label }))}
          placeholder={t('well')}
          searchPlaceholder={t('searchWell')}
          emptyMessage={t('noWellFound')}
          isLoading={isLoadingWells}
          className='h-9'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-sm font-medium'>{t('sampleType')}</Label>
        <Combobox
          value={localFilters.sampleType}
          onValueChange={(value) =>
            setLocalFilters((prev) => ({
              ...prev,
              sampleType: value as SampleType
            }))
          }
          options={SAMPLE_TYPE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label
          }))}
          placeholder={t('sampleType')}
          searchPlaceholder={t('searchSampleType')}
          emptyMessage={t('noSampleTypeFound')}
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
