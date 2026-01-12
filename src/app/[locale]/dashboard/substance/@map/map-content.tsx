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
import type { WellMetrics } from '@/features/substance/types';

// GeoJSON data for Berazategui area
const berazateguiGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Sitio Berazategui'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-58.2196000123723, -34.75619866428026],
            [-58.21956434518026, -34.75619651877267],
            [-58.21586280401458, -34.75255464428908],
            [-58.21930539716304, -34.75098502157654],
            [-58.22267586251882, -34.75008569684534],
            [-58.2237752342892, -34.75066259295767],
            [-58.22377351088449, -34.75069552593777],
            [-58.2196000123723, -34.75619866428026]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Area A y B'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-58.22297752409376, -34.75175462476232],
            [-58.22210006256002, -34.75290568038414],
            [-58.22167807085697, -34.75345923647524],
            [-58.22131162157603, -34.75393992662589],
            [-58.21969994966852, -34.75300283679953],
            [-58.22191178727422, -34.75028072301095],
            [-58.22266552421831, -34.7500797674283],
            [-58.22380527974018, -34.75066873895759],
            [-58.22297752409376, -34.75175462476232]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Area C'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-58.21936865371102, -34.75587193991112],
            [-58.21965898641658, -34.75598036726309],
            [-58.21955237371767, -34.75615603585206],
            [-58.21755629578937, -34.75420156956534],
            [-58.21807015995521, -34.75397446565304],
            [-58.21936865371102, -34.75587193991112]
          ]
        ]
      }
    }
  ]
};

interface MapContentProps {
  data: WellMetrics[];
  guideLevel: number;
}

function LocationTooltip({ well }: { well: WellMetrics }) {
  const t = useTranslations('dashboard.map.locationTooltip');

  return (
    <div className='space-y-1 p-2'>
      <p className='text-base font-bold'>{well.wellId}</p>
      <p className='text-sm'>
        {t('period')}: {well.firstPeriod} / {well.lastPeriod}
      </p>
      <p className='text-sm'>
        {t('sampleCount')}: {well.sampleCount}
      </p>
      <p className='text-sm'>
        {t('average')}: {well.mean} {well.unit}
      </p>
      <p className='text-sm'>
        {t('median')}: {well.median} {well.unit}
      </p>
      <p className='text-sm'>
        {t('minimum')}: {well.min} {well.unit}
      </p>
      <p className='text-sm'>
        {t('maximum')}: {well.max} {well.unit}
      </p>
      <p className='text-sm'>
        {t('standardDeviation')}: {well.stdDev} {well.unit}
      </p>
    </div>
  );
}

export function MapContent({ data, guideLevel }: MapContentProps) {
  // Calculate center from data or use default
  const center: [number, number] =
    data.length > 0
      ? [
          data.reduce((sum, w) => sum + w.lng, 0) / data.length,
          data.reduce((sum, w) => sum + w.lat, 0) / data.length
        ]
      : [-58.2196, -34.7532];

  // Calculate min and max values for scaling
  const meanValues = data.map((w) => w.mean);
  const minMean = Math.min(...meanValues);
  const maxMean = Math.max(...meanValues);

  // Function to calculate size based on mean value
  function calculateSize(mean: number): number {
    const minSize = 12; // 3 in tailwind (12px)
    const maxSize = 48; // 12 in tailwind (48px)

    // If all values are the same, return middle size
    if (maxMean === minMean) return 20;

    // Normalize between min and max size
    const normalized = (mean - minMean) / (maxMean - minMean);
    return minSize + normalized * (maxSize - minSize);
  }

  return (
    <Card className='h-full overflow-hidden p-0'>
      <Map center={center} zoom={14}>
        <MapControls showLocate showFullscreen />
        <MapStyleControl position='top-right' />

        {/* Background areas layer */}
        <GeoJSONLayer
          data={berazateguiGeoJson as GeoJSON.FeatureCollection}
          sourceId='berazategui'
          propertyKey='name'
        />

        {/* Wells markers */}
        {data.map((well) => {
          const exceedsGuide = well.mean > guideLevel;
          const size = calculateSize(well.mean);

          return (
            <MapMarker
              key={well.wellId}
              longitude={well.lng}
              latitude={well.lat}
            >
              <MarkerContent>
                <div
                  className={`cursor-pointer rounded-full border-2 border-white opacity-70 shadow-lg transition-transform hover:scale-110 ${
                    exceedsGuide ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${size}px`, height: `${size}px` }}
                />
              </MarkerContent>
              <MarkerPopup className='p-0'>
                <LocationTooltip well={well} />
              </MarkerPopup>
            </MapMarker>
          );
        })}
      </Map>
    </Card>
  );
}
