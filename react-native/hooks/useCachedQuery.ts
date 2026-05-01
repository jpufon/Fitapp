import { useEffect, useRef, useState } from 'react';
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
  const initialPayload = useState(() =>
    getCachedJson<CachedPayload<TQueryFnData>>(cacheKey),
  )[0];

  const query = useQuery({
    ...options,
    initialData: options.initialData ?? initialPayload?.data,
    initialDataUpdatedAt: options.initialDataUpdatedAt ?? initialPayload?.updatedAt,
  });

  const lastPersisted = useRef<TQueryFnData | undefined>(initialPayload?.data);
  useEffect(() => {
    if (query.data === undefined) return;
    if (Object.is(query.data, lastPersisted.current)) return;
    lastPersisted.current = query.data;
    setCachedJson<CachedPayload<TQueryFnData>>(cacheKey, {
      data: query.data,
      updatedAt: Date.now(),
    });
  }, [cacheKey, query.data]);

  return {
    ...query,
    isOfflineFallback: Boolean(query.error && query.data !== undefined),
  };
}
