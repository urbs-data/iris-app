'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryState, parseAsString, parseAsStringEnum } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Combobox } from '@/components/ui/combobox';
import { MultiSelect } from '@/components/ui/multi-select';
import type { DateRange } from 'react-day-picker';
import { X, Search } from 'lucide-react';
import { getWells } from '@/features/dashboards/substance/data/get-wells';
import { getAreas } from '@/features/dashboards/substance/data/get-areas';
import { getSubstances } from '@/features/dashboards/substance/data/get-substances';
import {
  WellType,
  SampleType,
  SUBSTANCE_DEFAULTS
} from '@/features/dashboards/substance/types';
import { resolveActionResult } from '@/lib/actions/client';
import { parseISO } from 'date-fns';
import { useTransitionContext } from '@/hooks/use-transition-context';

interface LocalFilters {
  dateRange: DateRange | undefined;
  substance?: string | null;
  wellType: WellType | null;
  area: string | null;
  wells: string[];
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

interface UnifiedFiltersProps {
  useSubstanceParams?: boolean;
}

export function UnifiedFilters({
  useSubstanceParams = false
}: UnifiedFiltersProps) {
  const t = useTranslations('substance');
  const { startTransition, isLoading } = useTransitionContext();
  const showSubstanceFilter = useSubstanceParams;

  const [dateFrom, setDateFrom] = useQueryState(
    'dateFrom',
    parseAsString.withOptions({
      shallow: false,
      startTransition
    })
  );
  const [dateTo, setDateTo] = useQueryState(
    'dateTo',
    parseAsString.withOptions({
      shallow: false,
      startTransition
    })
  );

  const [substance, setSubstance] = useQueryState(
    'substance',
    parseAsString.withOptions({
      shallow: false,
      startTransition
    })
  );

  const [wellType, setWellType] = useQueryState(
    'wellType',
    parseAsStringEnum<WellType>(Object.values(WellType)).withOptions({
      shallow: false,
      startTransition
    })
  );
  const [area, setArea] = useQueryState(
    'area',
    parseAsString.withOptions({ shallow: false, startTransition })
  );
  const [wells, setWells] = useQueryState(
    'wells',
    parseAsString.withOptions({ shallow: false, startTransition })
  );
  const [sampleType, setSampleType] = useQueryState(
    'sampleType',
    parseAsStringEnum<SampleType>(Object.values(SampleType)).withOptions({
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
    ...(showSubstanceFilter && { substance }),
    wellType: wellType ?? null,
    area,
    wells: wells ? wells.split(',') : [],
    sampleType: sampleType ?? SampleType.WATER
  });

  const { data: areas = [], isLoading: isLoadingAreas } = useQuery({
    queryKey: ['areas'],
    queryFn: () => resolveActionResult(getAreas())
  });

  const { data: wellsData = [], isLoading: isLoadingWells } = useQuery({
    queryKey: ['wells', localFilters.area],
    queryFn: () =>
      resolveActionResult(getWells({ area: localFilters.area || undefined }))
  });

  const { data: substances = [], isLoading: isLoadingSubstances } = useQuery({
    queryKey: ['substances'],
    queryFn: () => resolveActionResult(getSubstances()),
    enabled: showSubstanceFilter
  });

  async function handleSearch() {
    const updates = [
      setDateFrom(localFilters.dateRange?.from?.toISOString() || null),
      setDateTo(localFilters.dateRange?.to?.toISOString() || null),
      setWellType(localFilters.wellType || null),
      setArea(localFilters.area),
      setWells(
        localFilters.wells.length > 0 ? localFilters.wells.join(',') : null
      ),
      setSampleType(localFilters.sampleType)
    ];

    if (showSubstanceFilter) {
      updates.push(setSubstance(localFilters.substance || null));
    }

    await Promise.all(updates);
  }

  const handleResetFilters = (): void => {
    const defaultDateRange: DateRange = {
      from: parseISO(SUBSTANCE_DEFAULTS.dateFrom),
      to: new Date()
    };

    setLocalFilters({
      dateRange: defaultDateRange,
      ...(showSubstanceFilter && { substance: null }),
      wellType: null,
      area: null,
      wells: [],
      sampleType: SampleType.WATER
    });

    setDateFrom(null);
    setDateTo(null);
    if (showSubstanceFilter) {
      setSubstance(null);
    }
    setWellType(null);
    setArea(null);
    setWells(null);
    setSampleType(null);
  };

  const hasActiveFilters =
    dateFrom ||
    dateTo ||
    (showSubstanceFilter && substance) ||
    wellType ||
    area ||
    wells ||
    sampleType;

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

      {showSubstanceFilter && (
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>{t('substance')}</Label>
          <Combobox
            value={localFilters.substance || null}
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
      )}

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
              wells: []
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
