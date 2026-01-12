import {
  createSearchParamsCache,
  createSerializer,
  parseAsString,
  parseAsStringEnum
} from 'nuqs/server';
import {
  WellType,
  SampleType,
  SUBSTANCE_DEFAULTS
} from '@/features/substance/types';

export const baseSearchParams = {
  dateFrom: parseAsString,
  dateTo: parseAsString,
  wellType: parseAsStringEnum<WellType>(Object.values(WellType)).withDefault(
    WellType.MONITORING
  ),
  area: parseAsString,
  wells: parseAsString,
  sampleType: parseAsStringEnum<SampleType>(
    Object.values(SampleType)
  ).withDefault(SampleType.WATER)
};

export const baseSearchParamsCache = createSearchParamsCache(baseSearchParams);
export const serializeBaseParams = createSerializer(baseSearchParams);

export { SUBSTANCE_DEFAULTS };
