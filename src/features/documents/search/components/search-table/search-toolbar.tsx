'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { parseAsString, parseAsInteger, useQueryStates } from 'nuqs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IconSearch, IconX } from '@tabler/icons-react';
import {
  YEARS,
  CLASSIFICATIONS,
  SUBCLASSIFICATIONS_MAP,
  FILE_TYPES
} from '@/constants/data';

interface LocalFilters {
  q: string;
  year: string | null;
  classification: string | null;
  subClassification: string | null;
  fileType: string | null;
}

export function SearchToolbar() {
  const t = useTranslations('search');

  const [queryFilters, setQueryFilters] = useQueryStates(
    {
      q: parseAsString,
      year: parseAsString,
      classification: parseAsString,
      subClassification: parseAsString,
      fileType: parseAsString,
      page: parseAsInteger.withDefault(1)
    },
    { shallow: false }
  );

  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    q: queryFilters.q || '',
    year: queryFilters.year,
    classification: queryFilters.classification,
    subClassification: queryFilters.subClassification,
    fileType: queryFilters.fileType
  });

  const subClassifications = localFilters.classification
    ? SUBCLASSIFICATIONS_MAP[localFilters.classification] || []
    : [];

  const hasLocalFilters =
    localFilters.q ||
    localFilters.year ||
    localFilters.classification ||
    localFilters.subClassification ||
    localFilters.fileType;

  function handleClassificationChange(value: string) {
    setLocalFilters((prev) => ({
      ...prev,
      classification: value === 'all' ? null : value,
      subClassification: null
    }));
  }

  function handleSearch() {
    setQueryFilters({
      q: localFilters.q || null,
      year: localFilters.year,
      classification: localFilters.classification,
      subClassification: localFilters.subClassification,
      fileType: localFilters.fileType,
      page: 1
    });
  }

  function handleResetFilters() {
    const emptyFilters: LocalFilters = {
      q: '',
      year: null,
      classification: null,
      subClassification: null,
      fileType: null
    };
    setLocalFilters(emptyFilters);
    setQueryFilters({
      q: null,
      year: null,
      classification: null,
      subClassification: null,
      fileType: null,
      page: 1
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <div className='mb-2 grid grid-cols-1 gap-2 sm:grid-cols-12 sm:grid-rows-2'>
      {/* Input de búsqueda - Primera fila */}
      <Input
        placeholder={t('search')}
        value={localFilters.q}
        onChange={(e) =>
          setLocalFilters((prev) => ({ ...prev, q: e.target.value }))
        }
        onKeyDown={handleKeyDown}
        className='col-span-1 sm:col-span-10 sm:row-span-1'
      />

      {/* Botón de búsqueda  */}
      <Button onClick={handleSearch} className='col-span-1 sm:col-span-2'>
        <IconSearch className='mr-2 h-4 w-4' />
        {t('search')}
      </Button>

      {/* Filtros - Segunda fila */}
      <div className='col-span-1 grid grid-cols-1 gap-3 sm:col-span-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5'>
        <Select
          value={localFilters.year || 'all'}
          onValueChange={(value) =>
            setLocalFilters((prev) => ({
              ...prev,
              year: value === 'all' ? null : value
            }))
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder={t('years')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('years')}</SelectItem>
            {YEARS.map((yearOption) => (
              <SelectItem key={yearOption.value} value={yearOption.value}>
                {yearOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={localFilters.classification || 'all'}
          onValueChange={handleClassificationChange}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder={t('classifications')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('classifications')}</SelectItem>
            {CLASSIFICATIONS.map((classificationOption) => (
              <SelectItem
                key={classificationOption.value}
                value={classificationOption.value}
              >
                {classificationOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={localFilters.subClassification || 'all'}
          onValueChange={(value) =>
            setLocalFilters((prev) => ({
              ...prev,
              subClassification: value === 'all' ? null : value
            }))
          }
          disabled={
            !localFilters.classification || subClassifications.length === 0
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder={t('subClassifications')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('subClassifications')}</SelectItem>
            {subClassifications.map((subClassificationOption) => (
              <SelectItem
                key={subClassificationOption.value}
                value={subClassificationOption.value}
              >
                {subClassificationOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={localFilters.fileType || 'all'}
          onValueChange={(value) =>
            setLocalFilters((prev) => ({
              ...prev,
              fileType: value === 'all' ? null : value
            }))
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder={t('fileType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('fileType')}</SelectItem>
            {FILE_TYPES.map((fileTypeOption) => (
              <SelectItem
                key={fileTypeOption.value}
                value={fileTypeOption.value}
              >
                {t(`fileTypes.${fileTypeOption.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasLocalFilters && (
          <Button
            variant='outline'
            onClick={handleResetFilters}
            className='col-span-1 border-dashed sm:col-span-2 md:col-span-1 lg:col-span-1'
          >
            <IconX className='mr-2 h-4 w-4' />
            {t('resetFilters')}
          </Button>
        )}
      </div>
    </div>
  );
}
