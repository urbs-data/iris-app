'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { SubstanceFilters } from './substance-filters';
import { substanceSearchParams } from '../searchparams';
import { useActiveFiltersCount } from '@/hooks/use-active-filters-count';

export function SubstanceFiltersButton() {
  const t = useTranslations('substance');
  const [open, setOpen] = useState(false);
  const activeFiltersCount = useActiveFiltersCount(substanceSearchParams);

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
        <SheetHeader className='pb-4'>
          <SheetTitle>{t('filters')}</SheetTitle>
        </SheetHeader>
        <div>
          <SubstanceFilters />
        </div>
      </SheetContent>
    </Sheet>
  );
}
