import {
  createSearchParamsCache,
  createSerializer,
  parseAsString,
  parseAsStringLiteral
} from 'nuqs/server';

export const wellTypes = ['all', 'monitoring', 'pump'] as const;
export const sampleTypes = ['water', 'soil'] as const;

export const substanceSearchParams = {
  dateFrom: parseAsString,
  dateTo: parseAsString,
  substance: parseAsString,
  wellType: parseAsStringLiteral(wellTypes).withDefault('all'),
  area: parseAsString,
  well: parseAsString,
  sampleType: parseAsStringLiteral(sampleTypes).withDefault('water')
};

export const substanceSearchParamsCache = createSearchParamsCache(
  substanceSearchParams
);
export const serializeSubstanceParams = createSerializer(substanceSearchParams);
