'use client';

import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface MetadataBadgesProps {
  year?: number;
  classification?: string;
  subClassification?: string;
}

export function MetadataBadges({
  year,
  classification,
  subClassification
}: MetadataBadgesProps) {
  const t = useTranslations();

  return (
    <div className='flex flex-wrap gap-1'>
      {year && (
        <Badge variant='outline' className='shrink-0'>
          {year}
        </Badge>
      )}
      {classification && (
        <Badge variant='outline' className='shrink-0'>
          {t(`documentClassifications.${classification}`)}
        </Badge>
      )}
      {subClassification && (
        <Badge variant='outline' className='shrink-0'>
          {t(`documentSubclassifications.${subClassification}`)}
        </Badge>
      )}
    </div>
  );
}
