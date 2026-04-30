// Home data hooks — backed by a single GET /home call, sliced for each consumer.
// useTodaySteps still drives off Pedometer for instant local feedback; server
// stepsCount syncing is wired in mutation hooks (useLogNutrition).

import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useCachedQuery } from './useCachedQuery';
import { apiQuery, hasApiConfig } from '../lib/api';
import { getCachedJson, setCachedJson } from '../lib/storage';

// ─── Types matching backend GET /home response ─────────────────────────────

type Pillar = {
  current: number;
  target: number;
  progress: number; // 0..1 from backend
};

export type HomeSnapshot = {
  vitality: {
    score: number;
    treeState: 'wilted' | 'recovering' | 'sprout' | 'growing' | 'thriving' | 'full_vitality';
    streak: number;
  };
  pillars: {
    steps: Pillar;
    protein: Pillar;
    hydration: Pillar;
  };
  workout: HomeWorkout | null;
  unitSystem: 'metric' | 'imperial';
};

export type HomeWorkout = {
  id: string;
  name: string;
  type: string;
  startedAt: string;
  finishedAt: string | null;
};

// ─── Legacy display shapes — keep stable for HomeScreen ────────────────────

export type NutritionSummary = {
  protein: { current: number; target: number; progress: number }; // progress 0..100
  hydration: { current: number; target: number; progress: number };
};

export type VitalitySummary = {
  streak: number;
  score: number; // 0..100
};

export type StepsSummary = {
  steps: number;
  target: number;
  progress: number; // 0..100
};

export type WorkoutSummary = {
  id: string;
  name: string;
  type: string;
  exerciseCount: number;
  durationMinutes: number;
  completedAt?: string | null;
};

// ─── Canonical query: GET /home ────────────────────────────────────────────

const HOME_QUERY_KEY = ['home', 'snapshot'] as const;

function fetchHomeSnapshot(): Promise<HomeSnapshot> {
  return apiQuery<HomeSnapshot>('/home');
}

export function useHomeSnapshot() {
  return useCachedQuery<HomeSnapshot>({
    queryKey: HOME_QUERY_KEY,
    cacheKey: 'query.home.snapshot',
    queryFn: fetchHomeSnapshot,
    enabled: hasApiConfig,
  });
}

// ─── Sliced hooks — share the underlying /home query via queryKey ──────────

function pct(value01: number): number {
  return Math.round(Math.max(0, Math.min(1, value01)) * 100);
}

function sliceNutrition(snap: HomeSnapshot): NutritionSummary {
  return {
    protein: {
      current: snap.pillars.protein.current,
      target: snap.pillars.protein.target,
      progress: pct(snap.pillars.protein.progress),
    },
    hydration: {
      current: snap.pillars.hydration.current,
      target: snap.pillars.hydration.target,
      progress: pct(snap.pillars.hydration.progress),
    },
  };
}

function sliceVitality(snap: HomeSnapshot): VitalitySummary {
  return {
    streak: snap.vitality.streak,
    score: pct(snap.vitality.score),
  };
}

function sliceWorkout(snap: HomeSnapshot): WorkoutSummary | null {
  if (!snap.workout) return null;
  return {
    id: snap.workout.id,
    name: snap.workout.name,
    type: snap.workout.type,
    exerciseCount: 0, // /home doesn't include sets — caller can hit /workouts/:id for detail
    durationMinutes: 0,
    completedAt: snap.workout.finishedAt,
  };
}

export function useNutritionToday() {
  const q = useHomeSnapshot();
  return useMemo(
    () => ({
      ...q,
      data: q.data ? sliceNutrition(q.data) : undefined,
    }),
    [q],
  );
}

export function useVitalityCurrent() {
  const q = useHomeSnapshot();
  return useMemo(
    () => ({
      ...q,
      data: q.data ? sliceVitality(q.data) : undefined,
    }),
    [q],
  );
}

export function useTodayWorkout() {
  const q = useHomeSnapshot();
  return useMemo(
    () => ({
      ...q,
      data: q.data ? sliceWorkout(q.data) : undefined,
    }),
    [q],
  );
}

// ─── Steps: device-side via Pedometer ──────────────────────────────────────

async function fetchTodaySteps(): Promise<StepsSummary> {
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

  const fallback = getCachedJson<StepsSummary>('home.steps') ?? { steps: 0, target, progress: 0 };

  if (Platform.OS === 'ios') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const result = await Pedometer.getStepCountAsync(start, new Date());
    const normalized: StepsSummary = {
      steps: result.steps,
      target,
      progress: Math.round(Math.min(100, (result.steps / target) * 100)),
    };
    setCachedJson('home.steps', normalized);
    return normalized;
  }

  return fallback;
}

export function useTodaySteps() {
  const query = useCachedQuery<StepsSummary>({
    queryKey: ['home', 'today-steps'],
    cacheKey: 'query.home.today-steps',
    queryFn: fetchTodaySteps,
  });

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;
    if (Platform.OS !== 'android') return;

    const existing = query.data ?? getCachedJson<StepsSummary>('home.steps');
    const baseSteps = existing?.steps ?? 0;

    subscription = Pedometer.watchStepCount((result) => {
      const next: StepsSummary = {
        steps: baseSteps + result.steps,
        target: 10_000,
        progress: Math.round(Math.min(100, ((baseSteps + result.steps) / 10_000) * 100)),
      };
      setCachedJson('home.steps', next);
    });

    return () => subscription?.remove();
  }, [query.data]);

  return query;
}
