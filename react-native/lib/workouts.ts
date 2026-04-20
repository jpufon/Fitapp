import { apiRequest } from './api';

export type WorkoutSummary = {
  id: string;
  name: string;
  type: string;
  exerciseCount: number;
  durationMinutes: number;
  completedAt?: string | null;
};

function readArrayPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [record.data, record.items, record.workouts, record.results];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
  }

  return [];
}

function readTodayPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [record.data, record.workout, record.workouts, record.plan];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }

      if (candidate && typeof candidate === 'object') {
        return [candidate];
      }
    }

    return [record];
  }

  return [];
}

function asString(value: unknown, fallback: string): string {
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

function deriveDurationMinutes(record: Record<string, unknown>): number {
  const directMinutes = asNumber(record.durationMinutes ?? record.minutes ?? record.estimatedMinutes);
  if (directMinutes > 0) {
    return directMinutes;
  }

  const seconds = asNumber(record.durationSec ?? record.durationSeconds ?? record.duration);
  if (seconds > 0) {
    return Math.max(1, Math.round(seconds / 60));
  }

  return 0;
}

function deriveExerciseCount(record: Record<string, unknown>): number {
  const directCount = asNumber(record.exerciseCount ?? record.exercisesCount ?? record.totalExercises);
  if (directCount > 0) {
    return directCount;
  }

  const exercises = record.exercises;
  if (Array.isArray(exercises)) {
    return exercises.length;
  }

  return 0;
}

function normalizeWorkout(item: unknown, index: number): WorkoutSummary {
  const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const idValue = record.id ?? record.workoutId ?? record._id ?? `workout-${index}`;

  return {
    id: String(idValue),
    name: asString(record.name ?? record.title, 'Untitled Workout'),
    type: asString(record.type ?? record.category ?? record.source, 'Workout'),
    exerciseCount: deriveExerciseCount(record),
    durationMinutes: deriveDurationMinutes(record),
    completedAt:
      typeof record.completedAt === 'string'
        ? record.completedAt
        : typeof record.date === 'string'
          ? record.date
          : null,
  };
}

export async function fetchTodaysPlan(): Promise<WorkoutSummary[]> {
  const payload = await apiRequest<unknown>('/workouts/today');
  return readTodayPayload(payload).map(normalizeWorkout);
}

export async function fetchWorkoutHistory(limit = 20): Promise<WorkoutSummary[]> {
  const payload = await apiRequest<unknown>(`/workouts?limit=${limit}`);
  return readArrayPayload(payload).map(normalizeWorkout);
}

export async function generateProgram(): Promise<void> {
  await apiRequest('/ai/generate-program', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
