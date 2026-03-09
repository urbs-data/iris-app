'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { es, enUS } from 'date-fns/locale';
import { useFormatter, useLocale } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  className,
  minDate,
  maxDate,
  disabled = false
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value);
  const format = useFormatter();
  const currentLocale = useLocale();
  const locale = currentLocale === 'es' ? es : enUS;

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    onChange?.(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className='mr-2 size-4' />
          {date ? format.dateTime(date, { dateStyle: 'medium' }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={handleDateChange}
          locale={locale}
          fromDate={minDate}
          toDate={maxDate}
          initialFocus
        />
        {date && (
          <div className='border-t p-3'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => handleDateChange(undefined)}
            >
              Limpiar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
