import {
  createSearchParamsCache,
  createSerializer,
  parseAsString
} from 'nuqs/server';

export const searchParams = {
  path: parseAsString.withDefault('/')
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
