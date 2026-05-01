// Home data hooks — backed by a single GET /home call (HomeScreen derives slices
// inline). useTodaySteps drives off Pedometer for instant local feedback; server
// stepsCount syncing is wired in mutation hooks (useLogNutrition).

import { useEffect } from 'react';
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

// ─── Steps: device-side via Pedometer ──────────────────────────────────────

const PED_GATE_KEY = 'pedometer.gate';
const PED_GATE_TTL_MS = 24 * 60 * 60 * 1000;

type PedometerGate = {
  available: boolean;
  granted: boolean;
  checkedAt: number;
};

let inflightGate: Promise<PedometerGate> | null = null;

async function ensurePedometerGate(): Promise<PedometerGate> {
  const cached = getCachedJson<PedometerGate>(PED_GATE_KEY);
  if (
    cached &&
    cached.available &&
    cached.granted &&
    Date.now() - cached.checkedAt < PED_GATE_TTL_MS
  ) {
    return cached;
  }

  if (inflightGate) return inflightGate;

  inflightGate = (async () => {
    const available = await Pedometer.isAvailableAsync();
    if (!available) {
      const gate: PedometerGate = { available: false, granted: false, checkedAt: Date.now() };
      setCachedJson(PED_GATE_KEY, gate);
      return gate;
    }

    const existing = await Pedometer.getPermissionsAsync();
    const result = existing.granted ? existing : await Pedometer.requestPermissionsAsync();
    const gate: PedometerGate = {
      available: true,
      granted: result.granted,
      checkedAt: Date.now(),
    };
    setCachedJson(PED_GATE_KEY, gate);
    return gate;
  })();

  try {
    return await inflightGate;
  } finally {
    inflightGate = null;
  }
}

async function fetchTodaySteps(): Promise<StepsSummary> {
  const target = 10_000;
  const gate = await ensurePedometerGate();
  if (!gate.available) {
    throw new Error('Step tracking is not available on this device.');
  }
  if (!gate.granted) {
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
