'use client';

import {
  GeoJSONLayer,
  Map,
  MapControls,
  MapStyleControl
} from '@/components/ui/map';
import { Card } from '@/components/ui/card';
import { berazateguiGeoJson } from './data';

export default function Sales() {
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
