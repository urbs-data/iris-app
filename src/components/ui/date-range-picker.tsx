'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { es, enUS } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useLocale } from 'next-intl';

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
  numberOfMonths?: number;
}

const ES_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Seleccionar rango de fechas',
  className,
  minYear = 2020,
  maxYear = new Date().getFullYear(),
  disabled = false,
  numberOfMonths = 2
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value);
  const [month, setMonth] = React.useState<Date>(value?.from || new Date());
  const format = useFormatter();
  const t = useTranslations('components.dateRangePicker');
  const currentLocale = useLocale();
  const locale = currentLocale === 'es' ? es : enUS;

  React.useEffect(() => {
    setDate(value);
    if (value?.from) {
      setMonth(value.from);
    }
  }, [value]);

  const years = React.useMemo(() => {
    const yearList: number[] = [];
    for (let year = minYear; year <= maxYear; year++) {
      yearList.push(year);
    }
    return yearList;
  }, [minYear, maxYear]);

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    onChange?.(newDate);
  };

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(month);
    newMonth.setMonth(parseInt(monthIndex));
    setMonth(newMonth);
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(month);
    newMonth.setFullYear(parseInt(year));
    setMonth(newMonth);
  };

  const formatDateRange = () => {
    if (!date?.from) return placeholder;

    if (!date.to) {
      return format.dateTime(date.from, { dateStyle: 'medium' });
    }

    return format.dateTimeRange(date.from, date.to, { dateStyle: 'medium' });
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
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <div className='flex items-center justify-center gap-2 border-b p-3'>
          <Select
            value={month.getMonth().toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className='w-[130px]'>
              <SelectValue placeholder={t('month')} />
            </SelectTrigger>
            <SelectContent>
              {(currentLocale === 'es' ? ES_MONTHS : EN_MONTHS).map(
                (monthName, index) => (
                  <SelectItem key={monthName} value={index.toString()}>
                    {monthName}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          <Select
            value={month.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className='w-[100px]'>
              <SelectValue placeholder={t('year')} />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode='range'
          defaultMonth={month}
          month={month}
          onMonthChange={setMonth}
          selected={date}
          onSelect={handleDateChange}
          numberOfMonths={numberOfMonths}
          locale={locale}
        />
        {date?.from && (
          <div className='border-t p-3'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => handleDateChange(undefined)}
            >
              {t('clearSelection')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
