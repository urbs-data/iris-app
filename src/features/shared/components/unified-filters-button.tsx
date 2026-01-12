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
import { UnifiedFilters } from './unified-filters';
import { useActiveFiltersCount } from '@/hooks/use-active-filters-count';
import { baseSearchParams } from '../searchparams';
import { substanceSearchParams } from '@/features/substance/searchparams';

interface UnifiedFiltersButtonProps {
  showSubstanceFilter?: boolean;
}

export function UnifiedFiltersButton({
  showSubstanceFilter = false
}: UnifiedFiltersButtonProps) {
  const t = useTranslations('substance');
  const [open, setOpen] = useState(false);
  const searchParams = showSubstanceFilter
    ? substanceSearchParams
    : baseSearchParams;
  const activeFiltersCount = useActiveFiltersCount(searchParams);

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
          <UnifiedFilters useSubstanceParams={showSubstanceFilter} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
