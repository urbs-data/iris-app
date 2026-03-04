'use client';

import {
  GeoJSONLayer,
  Map,
  MapControls,
  MapStyleControl,
  MapMarker,
  MarkerContent,
  MarkerPopup
} from '@/components/ui/map';
import { Card } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import type { FQWellMetrics } from '@/features/dashboards/physico-chemical/types';
import { berazateguiGeoJson } from '@/shared/lib/berazategui-geojson';

interface FqMapContentProps {
  data: FQWellMetrics[];
}

function FqLocationTooltip({ well }: { well: FQWellMetrics }) {
  const t = useTranslations('dashboard.map.locationTooltip');

  return (
    <div className='space-y-1 p-2'>
      <p className='text-base font-bold'>{well.wellId}</p>
      <p className='text-sm'>
        {t('sampleCount')}: {well.sampleCount}
      </p>
      <p className='text-sm'>
        {t('average')}: {well.mean.toFixed(2)} {well.unit}
      </p>
      <p className='text-sm'>
        {t('minimum')}: {well.min.toFixed(2)} {well.unit}
      </p>
      <p className='text-sm'>
        {t('maximum')}: {well.max.toFixed(2)} {well.unit}
      </p>
    </div>
  );
}

export function FqMapContent({ data }: FqMapContentProps) {
  const center: [number, number] =
    data.length > 0
      ? [
          data.reduce((sum, w) => sum + w.lng, 0) / data.length,
          data.reduce((sum, w) => sum + w.lat, 0) / data.length
        ]
      : [-58.2196, -34.7532];

  const meanValues = data.map((w) => w.mean);
  const minMean = Math.min(...meanValues);
  const maxMean = Math.max(...meanValues);

  function calculateSize(mean: number): number {
    const minSize = 12;
    const maxSize = 48;
    if (maxMean === minMean) return 20;
    const normalized = (mean - minMean) / (maxMean - minMean);
    return minSize + normalized * (maxSize - minSize);
  }

  return (
    <Card className='h-full overflow-hidden p-0'>
      <Map center={center} zoom={14}>
        <MapControls showLocate showFullscreen />
        <MapStyleControl position='top-right' />

        <GeoJSONLayer
          data={berazateguiGeoJson as GeoJSON.FeatureCollection}
          sourceId='berazategui'
          propertyKey='name'
        />

        {data.map((well) => {
          const size = calculateSize(well.mean);

          return (
            <MapMarker
              key={well.wellId}
              longitude={well.lng}
              latitude={well.lat}
            >
              <MarkerContent>
                <div
                  className='bg-primary cursor-pointer rounded-full border-2 border-white opacity-70 shadow-lg transition-transform hover:scale-110'
                  style={{ width: `${size}px`, height: `${size}px` }}
                />
              </MarkerContent>
              <MarkerPopup className='p-0'>
                <FqLocationTooltip well={well} />
              </MarkerPopup>
            </MapMarker>
          );
        })}
      </Map>
    </Card>
  );
}
