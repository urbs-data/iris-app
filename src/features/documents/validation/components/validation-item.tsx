'use client';

import { useTranslations } from 'next-intl';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { ValidationResultData } from '../lib/models';
import { statusConfig } from './status-badge';
import { ResultsTable } from './results-table';

interface ValidationItemProps {
  result: ValidationResultData;
  index: number;
}

export function ValidationItem({ result, index }: ValidationItemProps) {
  const t = useTranslations('validation');
  const config = statusConfig[result.estado];
  const Icon = config.icon;

  const formattedDescription = t(result.descripcion, result.formateo);

  return (
    <AccordionItem
      value={`${result.codigo}-${index}`}
      className='mb-3 overflow-hidden rounded-md border'
    >
      <AccordionTrigger
        className={`px-4 py-3 ${config.color} hover:no-underline`}
      >
        <div className='flex w-full items-center'>
          <Icon className='mr-2 h-4 w-4' />
          <span className='text-left font-medium'>{result.codigo}</span>
          <span className='text-md text-muted-foreground pl-2'>
            {formattedDescription}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className='overflow-hidden px-4 py-3'>
        <div className='space-y-3'>
          <div className='font-medium'>{result.codigo}</div>
          <div className='text-gray-700'>{formattedDescription}</div>
        </div>

        {result.datos && result.datos.length > 0 && (
          <ResultsTable datos={result.datos} />
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
