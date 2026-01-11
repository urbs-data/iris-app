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
import { getSubstancesSync } from '../data/get-substances';
import { getAreasSync } from '../data/get-areas';
import { getWells } from '../data/get-wells';
import { wellTypes, sampleTypes } from '../searchparams';

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
      substance: parseAsString,
      wellType: parseAsStringLiteral(wellTypes).withDefault('all'),
      area: parseAsString,
      well: parseAsString,
      sampleType: parseAsStringLiteral(sampleTypes).withDefault('water')
    },
    { shallow: false }
  );

  // Parse initial date range from query params
  const initialDateRange: DateRange | undefined =
    queryFilters.dateFrom || queryFilters.dateTo
      ? {
          from: queryFilters.dateFrom
            ? new Date(queryFilters.dateFrom)
            : undefined,
          to: queryFilters.dateTo ? new Date(queryFilters.dateTo) : undefined
        }
      : {
          from: new Date('2019-01-01'),
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

  // Get static data
  const substances = getSubstancesSync();
  const areas = getAreasSync();

  // Fetch wells based on selected area using react-query
  const { data: wells = [], isLoading: isLoadingWells } = useQuery({
    queryKey: ['wells', localFilters.area],
    queryFn: () => getWells(localFilters.area || undefined),
    staleTime: 5 * 60 * 1000 // 5 minutes
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
      <Select
        value={localFilters.area || 'all'}
        onValueChange={(value) =>
          handleAreaChange(value === 'all' ? null : value)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder={t('area')} />
        </SelectTrigger>
        <SelectContent>
          {areas.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
        disabled={!localFilters.area || localFilters.area === 'all'}
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
