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
}

const GAP_PX = 4;
const OVERFLOW_BADGE_RESERVE = 52;

function useOverflowCount(
  items: MultiSelectOption[],
  containerRef: React.RefObject<HTMLDivElement | null>,
  measureRef: React.RefObject<HTMLDivElement | null>
) {
  const [visibleCount, setVisibleCount] = React.useState(items.length);

  React.useLayoutEffect(() => {
    if (items.length <= 1) {
      setVisibleCount(items.length);
      return;
    }

    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) {
      setVisibleCount(items.length);
      return;
    }

    const recalculate = () => {
      const containerWidth = container.clientWidth;
      const badges = Array.from(measure.children) as HTMLElement[];
      let usedWidth = 0;
      let count = 0;

      for (let i = 0; i < badges.length; i++) {
        const badgeWidth = badges[i].offsetWidth + (count > 0 ? GAP_PX : 0);
        const isLast = i === badges.length - 1;
        const available = isLast
          ? containerWidth
          : containerWidth - OVERFLOW_BADGE_RESERVE;

        if (usedWidth + badgeWidth > available) break;
        usedWidth += badgeWidth;
        count++;
      }

      setVisibleCount(Math.max(1, count));
    };

    recalculate();

    const observer = new ResizeObserver(recalculate);
    observer.observe(container);
    return () => observer.disconnect();
  }, [items, containerRef, measureRef]);

  return visibleCount;
}

export function MultiSelect({
  values = [],
  onValuesChange,
  options,
  placeholder,
  searchPlaceholder,
  className,
  disabled = false,
  isLoading = false
}: MultiSelectProps) {
  const t = useTranslations('components.multiSelect');
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLDivElement>(null);

  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => values.includes(option.value));
  }, [options, values]);

  const visibleCount = useOverflowCount(
    selectedOptions,
    containerRef,
    measureRef
  );
  const overflowCount = selectedOptions.length - visibleCount;

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

  return (
    <>
      {/* Off-screen measurement container for computing badge widths */}
      <div
        ref={measureRef}
        aria-hidden
        className='pointer-events-none fixed flex gap-1'
        style={{ top: -9999, left: -9999, visibility: 'hidden' }}
      >
        {selectedOptions.map((opt) => (
          <Badge
            key={opt.value}
            variant='secondary'
            className='shrink-0 whitespace-nowrap'
          >
            {opt.label}
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            disabled={disabled || isLoading}
            className={cn('w-full justify-between', className)}
          >
            {isLoading ? (
              <div className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>{t('loading')}</span>
              </div>
            ) : selectedOptions.length === 0 ? (
              <span className='text-muted-foreground'>
                {placeholder || t('placeholder')}
              </span>
            ) : (
              <div
                ref={containerRef}
                className='flex min-w-0 flex-1 items-center gap-1 overflow-hidden'
              >
                {selectedOptions.slice(0, visibleCount).map((opt) => (
                  <Badge
                    key={opt.value}
                    variant='secondary'
                    className='shrink-0 whitespace-nowrap'
                  >
                    {opt.label}
                  </Badge>
                ))}
                {overflowCount > 0 && (
                  <Badge
                    variant='secondary'
                    className='shrink-0 whitespace-nowrap'
                  >
                    +{overflowCount}
                  </Badge>
                )}
              </div>
            )}
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
                  <Badge
                    key={option.value}
                    variant='secondary'
                    className='gap-1'
                  >
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
    </>
  );
}
