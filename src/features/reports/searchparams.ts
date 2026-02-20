import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger
} from 'nuqs/server';

export const reportsSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(50)
};

export const reportsSearchParamsCache =
  createSearchParamsCache(reportsSearchParams);
export const reportsSerialize = createSerializer(reportsSearchParams);
