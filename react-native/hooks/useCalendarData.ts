import { useMemo } from 'react';
import { apiRequest, hasApiConfig } from '../lib/api';
import { useCachedQuery } from './useCachedQuery';

export type CalendarDayItem = {
  date: string;
  hasActivity: boolean;
  completed: boolean;
  type: 'training' | 'rest';
  score: number;
  workoutName: string | null;
  exerciseCount: number;
  durationMinutes: number;
  hydrationMl: number;
  proteinG: number;
  stepsCount: number;
  notes: string | null;
};

export type CalendarDayDetail = CalendarDayItem & {
  vitalityScore: number;
};

export type CalendarStats = {
  workouts: number;
  streak: number;
  avgScore: number;
};

type CalendarRangeResponse = {
  days: CalendarDayItem[];
  stats: CalendarStats;
};

export type CalendarWindow = {
  start: string;
  end: string;
};

const mockDays: CalendarDayItem[] = Array.from({ length: 30 }, (_, index) => {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth(), index + 1);
  const hasActivity = index < 18 && index % 3 !== 1;
  const completed = hasActivity && index < today.getDate() - 1;
  const score = hasActivity ? 68 + ((index * 7) % 24) : 0;

  return {
    date: formatLocalDate(date),
    hasActivity,
    completed,
    type: hasActivity ? 'training' : 'rest',
    score,
    workoutName: hasActivity ? 'Upper Body Strength' : null,
    exerciseCount: hasActivity ? 6 : 0,
    durationMinutes: hasActivity ? 45 : 0,
    hydrationMl: hasActivity ? 1875 + index * 10 : 0,
    proteinG: hasActivity ? 142 : 0,
    stepsCount: hasActivity ? 6240 + index * 40 : 3200 + index * 10,
    notes: completed ? 'Felt strong today, hit a PR on bench press!' : null,
  };
});

function formatMonthStats(days: CalendarDayItem[]): CalendarStats {
  const workoutDays = days.filter((day) => day.hasActivity);
  const completedScores = workoutDays.filter((day) => day.score > 0).map((day) => day.score);

  let streak = 0;
  let current = 0;

  for (const day of days) {
    if (day.hasActivity) {
      current += 1;
      streak = Math.max(streak, current);
    } else {
      current = 0;
    }
  }

  return {
    workouts: workoutDays.length,
    streak,
    avgScore: completedScores.length
      ? Math.round(completedScores.reduce((sum, value) => sum + value, 0) / completedScores.length)
      : 0,
  };
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

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readArrayPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [record.data, record.days, record.items, record.results];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
  }
  return [];
}

function normalizeCalendarDay(item: unknown): CalendarDayItem {
  const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const completed = Boolean(record.completed ?? record.hasActivity ?? record.workoutCompleted);
  const type = (record.type === 'rest' ? 'rest' : 'training') as 'training' | 'rest';
  const workout = record.workout && typeof record.workout === 'object'
    ? record.workout as Record<string, unknown>
    : record;
  const nutrition = record.nutrition && typeof record.nutrition === 'object'
    ? record.nutrition as Record<string, unknown>
    : record;
  const steps = record.steps && typeof record.steps === 'object'
    ? record.steps as Record<string, unknown>
    : record;

  return {
    date: typeof record.date === 'string' ? record.date : formatLocalDate(new Date()),
    hasActivity: Boolean(record.hasActivity ?? record.completed ?? workout.name),
    completed,
    type,
    score: asNumber(record.score ?? record.vitalityScore),
    workoutName: asString(workout.name ?? workout.title),
    exerciseCount: asNumber(workout.exerciseCount ?? workout.totalExercises),
    durationMinutes: asNumber(workout.durationMinutes ?? workout.minutes ?? workout.duration),
    hydrationMl: asNumber(nutrition.hydrationMl ?? nutrition.hydration ?? nutrition.waterMl),
    proteinG: asNumber(nutrition.proteinG ?? nutrition.protein ?? nutrition.proteinGrams),
    stepsCount: asNumber(steps.stepsCount ?? steps.steps ?? record.stepsCount),
    notes: asString(record.notes),
  };
}

function normalizeRangePayload(payload: unknown): CalendarRangeResponse {
  const days = readArrayPayload(payload).map(normalizeCalendarDay);
  return {
    days,
    stats: formatMonthStats(days),
  };
}

function normalizeDayPayload(payload: unknown, date: string): CalendarDayDetail {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const normalized = normalizeCalendarDay({ ...record, date });

  return {
    ...normalized,
    vitalityScore: asNumber(record.vitalityScore ?? record.score ?? normalized.score),
  };
}

function emptyCalendarDay(date: string): CalendarDayItem {
  return {
    date,
    hasActivity: false,
    completed: false,
    type: 'rest',
    score: 0,
    workoutName: null,
    exerciseCount: 0,
    durationMinutes: 0,
    hydrationMl: 0,
    proteinG: 0,
    stepsCount: 0,
    notes: null,
  };
}

function buildEmptyRange(start: string, end: string): CalendarRangeResponse {
  const startDate = parseLocalDate(start);
  const endDate = parseLocalDate(end);
  const days: CalendarDayItem[] = [];

  for (
    let cursor = startDate;
    cursor <= endDate;
    cursor = addDaysLocal(cursor, 1)
  ) {
    days.push(emptyCalendarDay(formatLocalDate(cursor)));
  }

  return {
    days,
    stats: { workouts: 0, streak: 0, avgScore: 0 },
  };
}

async function fetchCalendarRange(start: string, end: string): Promise<CalendarRangeResponse> {
  if (!hasApiConfig) {
    const days = mockDays.filter((day) => day.date >= start && day.date <= end);
    return {
      days,
      stats: formatMonthStats(days),
    };
  }

  const payload = await apiRequest<unknown>(`/calendar?start=${start}&end=${end}`);
  return normalizeRangePayload(payload);
}

async function fetchCalendarDay(date: string): Promise<CalendarDayDetail | null> {
  if (!hasApiConfig) {
    const day = mockDays.find((item) => item.date === date);
    return day ? { ...day, vitalityScore: day.score } : null;
  }

  const payload = await apiRequest<unknown>(`/calendar/${date}`);
  if (!payload) {
    return null;
  }
  return normalizeDayPayload(payload, date);
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function startOfWeekLocal(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  return copy;
}

export function addDaysLocal(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function addMonthsLocal(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function buildMonthGrid(currentDate: Date, days: CalendarDayItem[]): Array<CalendarDayItem | null> {
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const offset = firstDay.getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const byDate = new Map(days.map((day) => [day.date, day]));

  const leading = Array.from({ length: offset }, () => null);
  const cells = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), index + 1);
    const key = formatLocalDate(date);
    return byDate.get(key) ?? {
      date: key,
      hasActivity: false,
      completed: false,
      type: 'rest' as const,
      score: 0,
      workoutName: null,
      exerciseCount: 0,
      durationMinutes: 0,
      hydrationMl: 0,
      proteinG: 0,
      stepsCount: 0,
      notes: null,
    };
  });

  return [...leading, ...cells];
}

export function getCalendarWindow(currentDate: Date): CalendarWindow {
  const start = formatLocalDate(startOfWeekLocal(addDaysLocal(currentDate, -7)));
  const endOfWindow = addDaysLocal(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 7);
  const end = formatLocalDate(endOfWindow);

  return { start, end };
}

export function useCalendarRange(currentDate: Date) {
  const { start, end } = useMemo(() => getCalendarWindow(currentDate), [currentDate]);

  return useCachedQuery({
    queryKey: ['calendar', 'range', start, end],
    cacheKey: `query.calendar.range.${start}.${end}`,
    queryFn: () => fetchCalendarRange(start, end),
    placeholderData: buildEmptyRange(start, end),
    staleTime: 30_000,
  });
}

export function useCalendarDay(selectedDate: string, enabled = true) {
  return useCachedQuery({
    queryKey: ['calendar', 'day', selectedDate],
    cacheKey: `query.calendar.day.${selectedDate}`,
    queryFn: () => fetchCalendarDay(selectedDate),
    enabled,
    placeholderData: enabled ? { ...emptyCalendarDay(selectedDate), vitalityScore: 0 } : undefined,
    staleTime: 30_000,
  });
}
