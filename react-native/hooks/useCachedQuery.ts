import { useEffect } from 'react';
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { getCachedJson, setCachedJson } from '../lib/storage';

type CachedPayload<T> = {
  data: T;
  updatedAt: number;
};

type CachedQueryOptions<TQueryFnData, TError>
  = Omit<UseQueryOptions<TQueryFnData, TError, TQueryFnData, QueryKey>, 'queryKey'> & {
    queryKey: QueryKey;
    cacheKey: string;
  };

export function useCachedQuery<TQueryFnData, TError = Error>({
  cacheKey,
  ...options
}: CachedQueryOptions<TQueryFnData, TError>): UseQueryResult<TQueryFnData, TError> & {
  isOfflineFallback: boolean;
} {
  const cached = getCachedJson<CachedPayload<TQueryFnData>>(cacheKey);

  const query = useQuery({
    ...options,
    initialData: options.initialData ?? cached?.data,
    initialDataUpdatedAt: options.initialDataUpdatedAt ?? cached?.updatedAt,
  });

  useEffect(() => {
    if (query.data !== undefined) {
      setCachedJson<CachedPayload<TQueryFnData>>(cacheKey, {
        data: query.data,
        updatedAt: Date.now(),
      });
    }
  }, [cacheKey, query.data]);

  return {
    ...query,
    isOfflineFallback: Boolean(query.error && query.data !== undefined),
  };
}
