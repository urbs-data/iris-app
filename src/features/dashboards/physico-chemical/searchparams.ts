import {
  createSearchParamsCache,
  createSerializer,
  parseAsString,
  parseAsStringEnum
} from 'nuqs/server';
import { WellType, FQ_DEFAULTS } from './types';
import { SampleType } from '../substance/types';

export const fqSearchParams = {
  dateFrom: parseAsString,
  dateTo: parseAsString,
  parametro: parseAsString.withDefault(FQ_DEFAULTS.parametro),
  substance: parseAsString.withDefault(FQ_DEFAULTS.substance),
  wellType: parseAsStringEnum<WellType>(Object.values(WellType)).withDefault(
    WellType.MONITORING
  ),
  area: parseAsString,
  wells: parseAsString,
  sampleType: parseAsStringEnum<SampleType>(
    Object.values(SampleType)
  ).withDefault(SampleType.WATER)
};

export const fqSearchParamsCache = createSearchParamsCache(fqSearchParams);
export const serializeFqParams = createSerializer(fqSearchParams);
