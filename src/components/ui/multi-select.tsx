'use client';

import * as React from 'react';
import { CheckIcon, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  values?: string[];
  onValuesChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxDisplay?: number;
}

export function MultiSelect({
  values = [],
  onValuesChange,
  options,
  placeholder,
  searchPlaceholder,
  className,
  disabled = false,
  isLoading = false,
  maxDisplay = 2
}: MultiSelectProps) {
  const t = useTranslations('components.multiSelect');
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => values.includes(option.value));
  }, [options, values]);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.value.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  function handleSelect(optionValue: string): void {
    const newValues = values.includes(optionValue)
      ? values.filter((v) => v !== optionValue)
      : [...values, optionValue];
    onValuesChange(newValues);
  }

  function handleRemove(optionValue: string): void {
    onValuesChange(values.filter((v) => v !== optionValue));
  }

  function getDisplayText(): React.ReactNode {
    if (isLoading) {
      return (
        <div className='flex items-center gap-2'>
          <Loader2 className='h-4 w-4 animate-spin' />
          <span>{t('loading')}</span>
        </div>
      );
    }

    if (selectedOptions.length === 0) {
      return (
        <span className='text-muted-foreground'>
          {placeholder || t('placeholder')}
        </span>
      );
    }

    if (selectedOptions.length === 1) {
      return selectedOptions[0].label;
    }

    return `${t('multiple', { count: selectedOptions.length })}`;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn('w-full justify-between', className)}
        >
          {getDisplayText()}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[300px] p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder || placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? t('loading') : t('emptyMessage')}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => handleSelect(option.value)}
                >
                  <CheckIcon
                    className={cn(
                      'mr-2 h-4 w-4',
                      values.includes(option.value)
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {selectedOptions.length > 0 && (
          <div className='border-t p-2'>
            <div className='flex flex-wrap gap-1'>
              {selectedOptions.map((option) => (
                <Badge key={option.value} variant='secondary' className='gap-1'>
                  {option.label}
                  <button
                    type='button'
                    className='hover:bg-muted ml-1 rounded-full'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(option.value);
                    }}
                  >
                    <X className='h-3 w-3' />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
