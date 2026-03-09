import {
  createSearchParamsCache,
  createSerializer,
  parseAsString
} from 'nuqs/server';

export const correlationsSearchParams = {
  substance: parseAsString,
  dateFrom: parseAsString,
  dateTo: parseAsString,
  wells: parseAsString
};

export const correlationsSearchParamsCache = createSearchParamsCache(
  correlationsSearchParams
);

export const serializeCorrelationsParams = createSerializer(
  correlationsSearchParams
);
