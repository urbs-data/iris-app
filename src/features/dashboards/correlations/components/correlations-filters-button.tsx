'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { CorrelationsFilters } from './correlations-filters';
import { useActiveFiltersCount } from '@/hooks/use-active-filters-count';
import { correlationsSearchParams } from '../searchparams';

export function CorrelationsFiltersButton() {
  const t = useTranslations('dashboard.correlations');
  const [open, setOpen] = useState(false);
  const activeFiltersCount = useActiveFiltersCount(correlationsSearchParams);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='outline' className='relative h-9'>
          <Filter className='mr-2 h-4 w-4' />
          {t('filters')}
          {activeFiltersCount > 0 && (
            <Badge className='ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs'>
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className='overflow-y-auto p-6'>
        <SheetHeader className='p-0'>
          <SheetTitle>{t('filters')}</SheetTitle>
        </SheetHeader>
        <div>
          <CorrelationsFilters />
        </div>
      </SheetContent>
    </Sheet>
  );
}
