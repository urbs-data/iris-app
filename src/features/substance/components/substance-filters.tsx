'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryState } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Combobox } from '@/components/ui/combobox';
import { IconSearch } from '@tabler/icons-react';
import type { DateRange } from 'react-day-picker';
import { getSubstances } from '../data/get-substances';
import { getWells } from '../data/get-wells';
import { getAreas } from '../data/get-areas';
import { WellType, SampleType, SUBSTANCE_DEFAULTS } from '../types';
import { substanceSearchParams } from '../searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { parseISO } from 'date-fns';

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

  const [dateFrom, setDateFrom] = useQueryState(
    'dateFrom',
    substanceSearchParams.dateFrom.withOptions({ shallow: false })
  );
  const [dateTo, setDateTo] = useQueryState(
    'dateTo',
    substanceSearchParams.dateTo.withOptions({ shallow: false })
  );
  const [substance, setSubstance] = useQueryState(
    'substance',
    substanceSearchParams.substance.withOptions({ shallow: false })
  );
  const [wellType, setWellType] = useQueryState(
    'wellType',
    substanceSearchParams.wellType.withOptions({ shallow: false })
  );
  const [area, setArea] = useQueryState(
    'area',
    substanceSearchParams.area.withOptions({ shallow: false })
  );
  const [well, setWell] = useQueryState(
    'well',
    substanceSearchParams.well.withOptions({ shallow: false })
  );
  const [sampleType, setSampleType] = useQueryState(
    'sampleType',
    substanceSearchParams.sampleType.withOptions({ shallow: false })
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

  function handleAreaChange(value: string | null) {
    setLocalFilters((prev) => ({
      ...prev,
      area: value,
      well: null // Reset well when area changes
    }));
  }

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

  return (
    <div className='grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7'>
      {/* Date Range */}
      <DateRangePicker
        value={localFilters.dateRange}
        onValueChange={(range) =>
          setLocalFilters((prev) => ({ ...prev, dateRange: range }))
        }
        placeholder={t('dateRange')}
        className='col-span-2 md:col-span-1'
      />

      {/* Substance */}
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
        className='col-span-2 md:col-span-1'
      />

      {/* Well Type */}
      <Select
        value={localFilters.wellType || 'all'}
        onValueChange={(value) =>
          setLocalFilters((prev) => ({
            ...prev,
            wellType: value === 'all' ? null : (value as WellType)
          }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder={t('wellType')} />
        </SelectTrigger>
        <SelectContent>
          {WELL_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Area */}
      <Combobox
        value={localFilters.area}
        onValueChange={(value) =>
          setLocalFilters((prev) => ({ ...prev, area: value }))
        }
        options={areas.map((a) => ({ value: a.value, label: a.label }))}
        placeholder={t('area')}
        searchPlaceholder={t('searchArea')}
        emptyMessage={t('noAreaFound')}
        isLoading={isLoadingAreas}
      />

      {/* Well */}
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
      />

      {/* Sample Type */}
      <Select
        value={localFilters.sampleType}
        onValueChange={(value) =>
          setLocalFilters((prev) => ({
            ...prev,
            sampleType: value as SampleType
          }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder={t('sampleType')} />
        </SelectTrigger>
        <SelectContent>
          {SAMPLE_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search Button */}
      <Button onClick={handleSearch} className='col-span-2 md:col-span-1'>
        <IconSearch className='mr-2 h-4 w-4' />
        {t('search')}
      </Button>
    </div>
  );
}
