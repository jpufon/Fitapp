import { apiRequest, hasApiConfig } from '../lib/api';
import { colors } from '../theme';
import { useCachedQuery } from './useCachedQuery';

export type ProfileStat = {
  label: string;
  value: string;
  color: string;
};

const mockStats: ProfileStat[] = [
  { label: 'Total Workouts', value: '47', color: colors.blue },
  { label: 'Current Streak', value: '12', color: colors.energy },
  { label: 'PRs This Month', value: '8', color: colors.primary },
];

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

function normalizeStats(payload: unknown): ProfileStat[] {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  return [
    {
      label: 'Total Workouts',
      value: String(asNumber(record.totalWorkouts ?? record.workouts)),
      color: colors.blue,
    },
    {
      label: 'Current Streak',
      value: String(asNumber(record.currentStreak ?? record.streak)),
      color: colors.energy,
    },
    {
      label: 'PRs This Month',
      value: String(asNumber(record.prsThisMonth ?? record.monthlyPrs ?? record.prs)),
      color: colors.primary,
    },
  ];
}

async function fetchProfileStats(): Promise<ProfileStat[]> {
  if (!hasApiConfig) {
    return mockStats;
  }

  const payload = await apiRequest<unknown>('/users/me/stats');
  return normalizeStats(payload);
}

export function useProfileStats() {
  return useCachedQuery({
    queryKey: ['profile', 'stats'],
    cacheKey: 'query.profile.stats',
    queryFn: fetchProfileStats,
  });
}
