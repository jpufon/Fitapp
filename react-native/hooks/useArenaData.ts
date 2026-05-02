import { useEffect, useMemo } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { apiRequest, hasApiConfig } from '../lib/api';
import { getCachedJson, setCachedJson } from '../lib/storage';
import { hasSupabaseConfig, supabase } from '../utils/supabase';

export type FeedItem = {
  id: string;
  user: string;
  initials: string;
  eventType: string;
  exercise: string;
  value: string;
  delta: string | null;
  time: string;
  reactions: number;
  isRun: boolean;
};

export type Squad = {
  id: string;
  name: string;
  type: string;
  members: number;
  activeToday: number;
  forestHealth: number;
  rank: number;
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  initials: string;
  score: number;
  streak: number;
  isYou: boolean;
};

type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

const FEED_QUERY_KEY = ['arena', 'feed'];
const FEED_CACHE_KEY = 'arena.feed.last-page';

const mockFeed: FeedItem[] = [
  { id: '1', user: 'Sarah M.', initials: 'SM', eventType: 'Strength PR', exercise: 'Deadlift', value: '140kg', delta: '+5kg', time: '2h ago', reactions: 12, isRun: false },
  { id: '2', user: 'Mike T.', initials: 'MT', eventType: 'Run PR', exercise: '5K', value: '24:31', delta: '-45s', time: '5h ago', reactions: 8, isRun: true },
  { id: '3', user: 'Emma K.', initials: 'EK', eventType: 'Streak Milestone', exercise: '30-Day Streak', value: 'Longest ever', delta: null, time: '1d ago', reactions: 24, isRun: false },
  { id: '4', user: 'You', initials: 'ME', eventType: 'Workout Complete', exercise: 'Upper Body Strength', value: '4,820kg volume', delta: null, time: 'Today', reactions: 5, isRun: false },
];

const mockSquads: Squad[] = [
  { id: '1', name: 'Morning Warriors', type: 'Workout Squad', members: 12, activeToday: 8, forestHealth: 85, rank: 3 },
  { id: '2', name: '5K Crushers', type: 'Run Club', members: 8, activeToday: 5, forestHealth: 92, rank: 1 },
];

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Sarah M.', initials: 'SM', score: 2450, streak: 45, isYou: false },
  { rank: 2, name: 'Mike T.', initials: 'MT', score: 2380, streak: 38, isYou: false },
  { rank: 3, name: 'You', initials: 'ME', score: 2210, streak: 12, isYou: true },
  { rank: 4, name: 'Emma K.', initials: 'EK', score: 2150, streak: 30, isYou: false },
  { rank: 5, name: 'Tom R.', initials: 'TR', score: 2090, streak: 22, isYou: false },
];

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function normalizeFeedItem(item: unknown): FeedItem {
  const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const user = asString(record.user ?? record.username ?? record.displayName, 'Athlete');
  const initialsSource = user.split(' ').slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase();

  return {
    id: String(record.id ?? record.feedId ?? `feed-${Math.random().toString(36).slice(2)}`),
    user,
    initials: asString(record.initials, initialsSource || 'AT'),
    eventType: asString(record.eventType ?? record.type, 'Workout Complete'),
    exercise: asString(record.exercise ?? record.title, 'Workout'),
    value: asString(record.value ?? record.statValue, 'Complete'),
    delta: typeof record.delta === 'string' ? record.delta : null,
    time: asString(record.time ?? record.createdAtLabel, 'Now'),
    reactions: asNumber(record.reactions ?? record.reactionCount),
    isRun: Boolean(record.isRun ?? record.eventType === 'Run PR'),
  };
}

function normalizeSquad(item: unknown, index: number): Squad {
  const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  return {
    id: String(record.id ?? `squad-${index}`),
    name: asString(record.name, 'Squad'),
    type: asString(record.type, 'Workout Squad'),
    members: asNumber(record.members ?? record.memberCount),
    activeToday: asNumber(record.activeToday ?? record.active_count),
    forestHealth: asNumber(record.forestHealth ?? record.health ?? record.score),
    rank: asNumber(record.rank, index + 1),
  };
}

function normalizeLeaderboardEntry(item: unknown, index: number): LeaderboardEntry {
  const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const name = asString(record.name ?? record.user, 'Athlete');
  return {
    rank: asNumber(record.rank, index + 1),
    name,
    initials: asString(
      record.initials,
      name.split(' ').slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase() || 'AT'
    ),
    score: asNumber(record.score ?? record.points),
    streak: asNumber(record.streak ?? record.streakDays),
    isYou: Boolean(record.isYou ?? record.me),
  };
}

function readArrayPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [record.data, record.items, record.results, record.feed, record.squads, record.leaderboard];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
  }
  return [];
}

async function fetchFeedPage(cursor?: string | null): Promise<FeedPage> {
  if (!hasApiConfig) {
    return { items: mockFeed, nextCursor: null };
  }

  const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const payload = await apiRequest<unknown>(`/feed${suffix}`);

  const items = readArrayPayload(payload).map(normalizeFeedItem);
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};

  return {
    items,
    nextCursor: typeof record.nextCursor === 'string' ? record.nextCursor : null,
  };
}

async function fetchMySquads(): Promise<Squad[]> {
  if (!hasApiConfig) {
    return mockSquads;
  }

  const payload = await apiRequest<unknown>('/squads/mine');
  return readArrayPayload(payload).map(normalizeSquad);
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!hasApiConfig) {
    return mockLeaderboard;
  }

  const payload = await apiRequest<unknown>('/leaderboards/squad');
  return readArrayPayload(payload).map(normalizeLeaderboardEntry);
}

export function useArenaFeed() {
  const queryClient = useQueryClient();
  const netInfo = useNetInfo();
  const cachedFirstPage = getCachedJson<FeedPage>(FEED_CACHE_KEY);

  const query = useInfiniteQuery({
    queryKey: FEED_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam as string | null | undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: cachedFirstPage
      ? {
          pages: [cachedFirstPage],
          pageParams: [null],
        }
      : undefined,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (query.data?.pages?.[0]) {
      setCachedJson(FEED_CACHE_KEY, query.data.pages[0]);
    }
  }, [query.data]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      return;
    }

    const client = supabase;

    const invalidateFeed = () => {
      void queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY });
    };
    const channel = client.channel(`arena-feed-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    channel.on('broadcast', { event: 'new_feed_item' }, invalidateFeed);
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed' }, invalidateFeed);
    channel.subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [queryClient]);

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  return {
    ...query,
    items,
    isOfflineReadOnly: Boolean(
      netInfo.isConnected === false && cachedFirstPage && query.data?.pages.length
    ),
    isOfflineFallback: Boolean(query.error && query.data?.pages?.length),
  };
}

export function useReactToFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedId: string) => {
      if (!hasApiConfig) {
        return { feedId };
      }

      await apiRequest(`/feed/${feedId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ type: 'flame' }),
      });

      return { feedId };
    },
    onMutate: async (feedId) => {
      await queryClient.cancelQueries({ queryKey: FEED_QUERY_KEY });
      const previous = queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_QUERY_KEY);

      queryClient.setQueryData<InfiniteData<FeedPage>>(FEED_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === feedId ? { ...item, reactions: item.reactions + 1 } : item
            ),
          })),
        };
      });

      return { previous };
    },
    onError: (_error, _feedId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FEED_QUERY_KEY, context.previous);
      }
    },
  });
}

export function useMySquads(enabled = true) {
  return useQuery({
    queryKey: ['arena', 'squads'],
    queryFn: fetchMySquads,
    enabled,
  });
}

export function useSquadLeaderboard(enabled = true) {
  return useQuery({
    queryKey: ['arena', 'leaderboard'],
    queryFn: fetchLeaderboard,
    enabled,
  });
}
