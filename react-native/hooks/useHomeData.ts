import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useCachedQuery } from './useCachedQuery';
import { apiRequest, hasApiConfig } from '../lib/api';
import type { WorkoutSummary } from '../lib/workouts';
import { fetchTodaysPlan } from '../lib/workouts';
import { getCachedJson, setCachedJson } from '../lib/storage';

export type NutritionSummary = {
  protein: {
    current: number;
    target: number;
    progress: number;
  };
  hydration: {
    current: number;
    target: number;
    progress: number;
  };
};

export type VitalitySummary = {
  streak: number;
  score: number;
};

export type StepsSummary = {
  steps: number;
  target: number;
  progress: number;
};

const mockNutrition: NutritionSummary = {
  protein: {
    current: 105,
    target: 150,
    progress: 70,
  },
  hydration: {
    current: 2400,
    target: 3000,
    progress: 80,
  },
};

const mockVitality: VitalitySummary = {
  streak: 12,
  score: 75,
};

const mockWorkout: WorkoutSummary = {
  id: 'mock-home-workout',
  name: 'Upper Body Strength',
  type: 'Strength',
  exerciseCount: 6,
  durationMinutes: 45,
  completedAt: null,
};

const mockSteps: StepsSummary = {
  steps: 6842,
  target: 10000,
  progress: 68,
};

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
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

function normalizeNutrition(payload: unknown): NutritionSummary {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const proteinData = record.protein && typeof record.protein === 'object'
    ? record.protein as Record<string, unknown>
    : record;
  const hydrationData = record.hydration && typeof record.hydration === 'object'
    ? record.hydration as Record<string, unknown>
    : record;

  const proteinCurrent = asNumber(
    proteinData.current ?? proteinData.grams ?? proteinData.proteinGrams ?? record.proteinGrams
  );
  const proteinTarget = asNumber(
    proteinData.target ?? proteinData.goal ?? proteinData.targetGrams ?? record.proteinTarget ?? 150
  );

  const hydrationCurrent = asNumber(
    hydrationData.current ?? hydrationData.ml ?? hydrationData.waterMl ?? record.hydrationMl
  );
  const hydrationTarget = asNumber(
    hydrationData.target ?? hydrationData.goal ?? hydrationData.targetMl ?? record.hydrationTarget ?? 3000
  );

  return {
    protein: {
      current: proteinCurrent,
      target: proteinTarget,
      progress: clampPercentage(proteinTarget > 0 ? (proteinCurrent / proteinTarget) * 100 : 0),
    },
    hydration: {
      current: hydrationCurrent,
      target: hydrationTarget,
      progress: clampPercentage(hydrationTarget > 0 ? (hydrationCurrent / hydrationTarget) * 100 : 0),
    },
  };
}

function normalizeVitality(payload: unknown): VitalitySummary {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const streak = asNumber(record.streak ?? record.currentStreak ?? record.streakDays);
  const score = asNumber(record.score ?? record.vitalityScore ?? record.currentScore);

  return {
    streak,
    score,
  };
}

async function fetchNutritionToday(): Promise<NutritionSummary> {
  if (!hasApiConfig) {
    return mockNutrition;
  }

  const payload = await apiRequest<unknown>('/nutrition/today');
  return normalizeNutrition(payload);
}

async function fetchVitalityCurrent(): Promise<VitalitySummary> {
  if (!hasApiConfig) {
    return mockVitality;
  }

  const payload = await apiRequest<unknown>('/vitality/current');
  return normalizeVitality(payload);
}

async function fetchTodayWorkout(): Promise<WorkoutSummary | null> {
  if (!hasApiConfig) {
    return mockWorkout;
  }

  const workouts = await fetchTodaysPlan();
  return workouts[0] ?? null;
}

async function fetchTodaySteps(): Promise<StepsSummary> {
  if (!hasApiConfig) {
    return mockSteps;
  }

  const target = 10_000;
  const available = await Pedometer.isAvailableAsync();
  if (!available) {
    throw new Error('Step tracking is not available on this device.');
  }

  const permission = await Pedometer.getPermissionsAsync();
  const granted = permission.granted ? permission : await Pedometer.requestPermissionsAsync();

  if (!granted.granted) {
    throw new Error('Motion permission is required to read today’s steps.');
  }

  const fallback = getCachedJson<StepsSummary>('home.steps') ?? {
    steps: 0,
    target,
    progress: 0,
  };

  if (Platform.OS === 'ios') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const result = await Pedometer.getStepCountAsync(start, new Date());
    const normalized = {
      steps: result.steps,
      target,
      progress: clampPercentage((result.steps / target) * 100),
    };
    setCachedJson('home.steps', normalized);
    return normalized;
  }

  return fallback;
}

export function useNutritionToday() {
  return useCachedQuery({
    queryKey: ['home', 'nutrition-today'],
    cacheKey: 'query.home.nutrition-today',
    queryFn: fetchNutritionToday,
  });
}

export function useVitalityCurrent() {
  return useCachedQuery({
    queryKey: ['home', 'vitality-current'],
    cacheKey: 'query.home.vitality-current',
    queryFn: fetchVitalityCurrent,
  });
}

export function useTodayWorkout() {
  return useCachedQuery({
    queryKey: ['home', 'today-workout'],
    cacheKey: 'query.home.today-workout',
    queryFn: fetchTodayWorkout,
  });
}

export function useTodaySteps() {
  const query = useCachedQuery({
    queryKey: ['home', 'today-steps'],
    cacheKey: 'query.home.today-steps',
    queryFn: fetchTodaySteps,
  });

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;

    if (Platform.OS !== 'android') {
      return;
    }

    const existing = query.data ?? getCachedJson<StepsSummary>('home.steps');
    const baseSteps = existing?.steps ?? 0;

    subscription = Pedometer.watchStepCount((result) => {
      const next = {
        steps: baseSteps + result.steps,
        target: 10_000,
        progress: clampPercentage(((baseSteps + result.steps) / 10_000) * 100),
      };
      setCachedJson('home.steps', next);
      setCachedJson('query.home.today-steps', {
        data: next,
        updatedAt: Date.now(),
      });
    });

    return () => {
      subscription?.remove();
    };
  }, [query.data]);

  return useMemo(() => {
    const cached = getCachedJson<{
      data: StepsSummary;
      updatedAt: number;
    }>('query.home.today-steps');

    return {
      ...query,
      data: query.data ?? cached?.data,
    };
  }, [query]);
}
