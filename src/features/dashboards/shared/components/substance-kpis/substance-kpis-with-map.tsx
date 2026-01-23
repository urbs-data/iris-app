'use client';

import { useState } from 'react';
import { SubstanceKpis } from './substance-kpis';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { MapContent } from '@/app/[locale]/dashboard/substance/@map/map-content';
import { useTranslations } from 'next-intl';
import type {
  GeneralMetrics,
  WellMetrics
} from '@/features/dashboards/substance/types';

interface SubstanceKpisWithMapProps {
  title: string;
  generalMetrics: GeneralMetrics;
  wellMetrics: WellMetrics[];
  unit?: string;
  className?: string;
}

export function SubstanceKpisWithMap({
  title,
  generalMetrics,
  wellMetrics,
  unit,
  className
}: SubstanceKpisWithMapProps) {
  const t = useTranslations('dashboard');
  const [showMapModal, setShowMapModal] = useState(false);

  return (
    <>
      <SubstanceKpis
        title={title}
        generalMetrics={generalMetrics}
        wellMetrics={wellMetrics}
        unit={unit}
        onViewMap={() => setShowMapModal(true)}
        className={className}
      />

      <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent className='h-[90vh] p-0 sm:max-w-[90vw]'>
          <DialogHeader className='sr-only'>
            <DialogTitle>
              {t('map.title')} - {title}
            </DialogTitle>
          </DialogHeader>
          <div className='h-full w-full'>
            <MapContent
              data={wellMetrics}
              guideLevel={generalMetrics.guideLevel}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
