'use client';

import { FieldPath, FieldValues } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { BaseFormFieldProps, DatePickerConfig } from '@/types/base-form';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { enUS, es } from 'date-fns/locale';

interface FormDatePickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseFormFieldProps<TFieldValues, TName> {
  config?: DatePickerConfig;
}

function FormDatePicker<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  description,
  required,
  config = {},
  disabled,
  className
}: FormDatePickerProps<TFieldValues, TName>) {
  const { minDate, maxDate, disabledDates = [], placeholder } = config;

  const format = useFormatter();
  const currentLocale = useLocale();
  const locale = currentLocale === 'es' ? es : enUS;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={`flex flex-col ${className}`}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className='ml-1 text-red-500'>*</span>}
            </FormLabel>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant='outline'
                  className={`w-fit pl-3 text-left font-normal ${
                    !field.value && 'text-muted-foreground'
                  }`}
                  disabled={disabled}
                >
                  {field.value ? (
                    format.dateTime(field.value, { dateStyle: 'medium' })
                  ) : (
                    <span>{placeholder}</span>
                  )}
                  <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) => {
                  if (minDate && date < minDate) return true;
                  if (maxDate && date > maxDate) return true;
                  return disabledDates.some(
                    (disabledDate) => date.getTime() === disabledDate.getTime()
                  );
                }}
                initialFocus
                locale={locale}
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export { FormDatePicker };
