import {
  createSearchParamsCache,
  createSerializer,
  parseAsString
} from 'nuqs/server';

export const fqSearchParams = {
  dateFrom: parseAsString,
  dateTo: parseAsString,
  parametro: parseAsString,
  substance: parseAsString,
  area: parseAsString,
  wells: parseAsString
};

export const fqSearchParamsCache = createSearchParamsCache(fqSearchParams);
export const serializeFqParams = createSerializer(fqSearchParams);
