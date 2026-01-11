'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

interface DateRangePickerProps {
  value?: DateRange;
  onValueChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  align?: 'start' | 'center' | 'end';
  numberOfMonths?: number;
}

export function DateRangePicker({
  value,
  onValueChange,
  placeholder = 'Seleccionar rango de fechas',
  className,
  disabled = false,
  align = 'start',
  numberOfMonths = 2
}: DateRangePickerProps) {
  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return placeholder;

    if (range.to) {
      return `${format(range.from, 'MMM yyyy', { locale: es })} - ${format(range.to, 'MMM yyyy', { locale: es })}`;
    }

    return format(range.from, 'MMM yyyy', { locale: es });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {formatDateRange(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align={align}>
        <Calendar
          initialFocus
          mode='range'
          defaultMonth={value?.from}
          selected={value}
          onSelect={onValueChange}
          numberOfMonths={numberOfMonths}
        />
      </PopoverContent>
    </Popover>
  );
}
