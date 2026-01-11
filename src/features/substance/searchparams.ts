import {
  createSearchParamsCache,
  createSerializer,
  parseAsString,
  parseAsStringEnum
} from 'nuqs/server';
import { WellType, SampleType, SUBSTANCE_DEFAULTS } from './types';

export const substanceSearchParams = {
  dateFrom: parseAsString,
  dateTo: parseAsString,
  substance: parseAsString.withDefault(SUBSTANCE_DEFAULTS.substance),
  wellType: parseAsStringEnum<WellType>(Object.values(WellType)).withDefault(
    WellType.MONITORING
  ),
  area: parseAsString,
  well: parseAsString,
  sampleType: parseAsStringEnum<SampleType>(
    Object.values(SampleType)
  ).withDefault(SampleType.WATER)
};

export const substanceSearchParamsCache = createSearchParamsCache(
  substanceSearchParams
);
export const serializeSubstanceParams = createSerializer(substanceSearchParams);
