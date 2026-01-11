'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
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
import { wellTypes, sampleTypes } from '../searchparams';
import { resolveActionResult } from '@/lib/actions/client';
import { parseISO } from 'date-fns';

interface LocalFilters {
  dateRange: DateRange | undefined;
  substance: string | null;
  wellType: string;
  area: string | null;
  well: string | null;
  sampleType: string;
}

const WELL_TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'monitoring', label: 'Monitoreo' },
  { value: 'pump', label: 'Bomba' }
];

const SAMPLE_TYPE_OPTIONS = [
  { value: 'water', label: 'Agua' },
  { value: 'soil', label: 'Suelo' }
];

export function SubstanceFilters() {
  const t = useTranslations('substance');

  const [queryFilters, setQueryFilters] = useQueryStates(
    {
      dateFrom: parseAsString,
      dateTo: parseAsString,
      substance: parseAsString.withDefault('56-23-5'),
      wellType: parseAsStringLiteral(wellTypes).withDefault('all'),
      area: parseAsString,
      well: parseAsString,
      sampleType: parseAsStringLiteral(sampleTypes).withDefault('water')
    },
    { shallow: false }
  );

  const initialDateRange: DateRange | undefined =
    queryFilters.dateFrom || queryFilters.dateTo
      ? {
          from: queryFilters.dateFrom
            ? parseISO(queryFilters.dateFrom)
            : undefined,
          to: queryFilters.dateTo ? parseISO(queryFilters.dateTo) : undefined
        }
      : {
          from: parseISO('2019-01-01'),
          to: new Date()
        };

  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    dateRange: initialDateRange,
    substance: queryFilters.substance,
    wellType: queryFilters.wellType,
    area: queryFilters.area,
    well: queryFilters.well,
    sampleType: queryFilters.sampleType
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

  function handleSearch() {
    setQueryFilters({
      dateFrom: localFilters.dateRange?.from?.toISOString() || null,
      dateTo: localFilters.dateRange?.to?.toISOString() || null,
      substance: localFilters.substance,
      wellType: localFilters.wellType as (typeof wellTypes)[number],
      area: localFilters.area,
      well: localFilters.well,
      sampleType: localFilters.sampleType as (typeof sampleTypes)[number]
    });
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
        value={localFilters.wellType}
        onValueChange={(value) =>
          setLocalFilters((prev) => ({ ...prev, wellType: value }))
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
          setLocalFilters((prev) => ({ ...prev, sampleType: value }))
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
