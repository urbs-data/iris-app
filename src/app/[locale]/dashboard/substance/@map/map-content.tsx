'use client';

import {
  GeoJSONLayer,
  Map,
  MapControls,
  MapStyleControl
} from '@/components/ui/map';
import { Card } from '@/components/ui/card';

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

export function MapContent() {
  return (
    <Card className='h-full overflow-hidden p-0'>
      <Map center={[-58.2196, -34.7532]} zoom={14}>
        <MapControls showLocate showFullscreen />
        <MapStyleControl position='top-right' />
        <GeoJSONLayer
          data={berazateguiGeoJson as GeoJSON.FeatureCollection}
          sourceId='berazategui'
          propertyKey='name'
        />
      </Map>
    </Card>
  );
}
