// Timezone-aware day-keying + streak recompute. WF-016 + WF-022.
//
// Day keys are ISO date strings ("YYYY-MM-DD") representing midnight in the
// user's local timezone. We avoid Luxon by leaning on Intl.DateTimeFormat —
// it knows DST without us having to ship tzdata.
//
// Grace window: anything logged before 2am local is treated as the previous
// day. This keeps late-night gym sessions on the right side of the streak.
//
// Rest-day rule: a day not in User.trainingDays does NOT break the streak,
// even if no DailyScore row exists. This matches WF-022 — planned recovery
// must never penalise the tree.

import { prisma } from './prisma.js';

export const STREAK_THRESHOLD = 0.5;
const GRACE_HOURS = 2;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ─── Date keying ───────────────────────────────────────────────────────────

// Format a Date to YYYY-MM-DD in the given IANA timezone.
export function dayKeyInTz(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA gives "YYYY-MM-DD" directly, no parsing required.
  return fmt.format(date);
}

// Returns the local hour in the given timezone (0–23).
export function localHourInTz(date: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    hour12: false,
  });
  // en-GB hour formatting can return "24" at midnight — normalise.
  const raw = parseInt(fmt.format(date), 10);
  return raw === 24 ? 0 : raw;
}

// Returns the local weekday in the given timezone (0=Sun..6=Sat). Matches the
// integer encoding used in User.trainingDays. Operates on a Date instant.
export function weekdayInTz(date: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[fmt.format(date)] ?? 0;
}

// Returns the weekday of a day-key string. The key already encodes a calendar
// day in user-local terms, so we don't need a tz round-trip — noon UTC is a
// safe instant that every IANA tz reads as the same calendar day.
export function weekdayFromDayKey(dayKey: string): number {
  const d = new Date(`${dayKey}T12:00:00.000Z`);
  return d.getUTCDay();
}

// Today, in user-local terms, with the 2am grace window applied. A workout
// logged at 1:30am still counts for "yesterday" — that's how lifters think.
export function currentDayKeyWithGrace(timezone: string, now: Date = new Date()): string {
  const hour = localHourInTz(now, timezone);
  const adjusted = hour < GRACE_HOURS ? new Date(now.getTime() - ONE_DAY_MS) : now;
  return dayKeyInTz(adjusted, timezone);
}

// String-only date arithmetic — no Date round-trip needed for streak walking.
export function addDaysToKey(dayKey: string, delta: number): string {
  const d = new Date(`${dayKey}T12:00:00Z`); // noon UTC avoids DST edge cases
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// Convert a day key to the canonical Date stored on DailyScore (midnight UTC,
// matching dateAtMidnight in dailyScore.ts). Day keys ARE in user tz, but the
// DB stores them as a Date with no offset by convention — so we treat the key
// as if it were UTC.
export function dayKeyToDbDate(dayKey: string): Date {
  return new Date(`${dayKey}T00:00:00.000Z`);
}

// ─── Training day check ───────────────────────────────────────────────────

export function isTrainingWeekday(dayKey: string, trainingDays: number[], _timezone: string): boolean {
  if (!trainingDays.length) return true; // user hasn't picked a schedule — every day is fair game
  return trainingDays.includes(weekdayFromDayKey(dayKey));
}

// ─── Streak computation ───────────────────────────────────────────────────

export type StreakResult = {
  streak: number;
  longestStreak: number;
  freezeTokens: number;
  lastActiveDate: Date | null;
};

// Walk back from today (with grace) day by day. Each day either:
//   • has a DailyScore >= threshold              → streak continues
//   • is a rest day with no logged activity       → streak continues (WF-022)
//   • is a training day that fell short / missing → streak breaks
//
// We do NOT auto-consume freeze tokens here — that's a separate user action
// landing in Sprint 3 (WF-021). For now we surface freezeTokens read-only.
export async function recomputeStreak(userId: string): Promise<StreakResult> {
  const [user, vitalityState] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { trainingDays: true },
    }),
    prisma.vitalityState.findUnique({
      where: { userId },
      select: { timezone: true, longestStreak: true, freezeTokens: true },
    }),
  ]);
  if (!user || !vitalityState) {
    return { streak: 0, longestStreak: 0, freezeTokens: 0, lastActiveDate: null };
  }
  const tz = vitalityState.timezone || 'UTC';

  const todayKey = currentDayKeyWithGrace(tz);
  const earliestKey = addDaysToKey(todayKey, -365);

  const rows = await prisma.dailyScore.findMany({
    where: {
      userId,
      date: { gte: dayKeyToDbDate(earliestKey), lte: dayKeyToDbDate(todayKey) },
    },
    orderBy: { date: 'desc' },
    select: { date: true, totalScore: true, isRestDay: true, isFreezeDay: true },
  });
  const scoreByKey = new Map<string, { totalScore: number; isRestDay: boolean; isFreezeDay: boolean }>();
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    scoreByKey.set(key, {
      totalScore: row.totalScore,
      isRestDay: row.isRestDay,
      isFreezeDay: row.isFreezeDay,
    });
  }

  let streak = 0;
  let lastActiveDate: Date | null = null;
  let cursorKey = todayKey;
  for (let i = 0; i < 365; i += 1) {
    const score = scoreByKey.get(cursorKey);
    const isTraining = isTrainingWeekday(cursorKey, user.trainingDays, tz);

    if (score) {
      if (score.totalScore >= STREAK_THRESHOLD || score.isRestDay || score.isFreezeDay) {
        streak += 1;
        if (!lastActiveDate) lastActiveDate = dayKeyToDbDate(cursorKey);
      } else {
        break;
      }
    } else if (!isTraining) {
      // Rest weekday with no row — neutral. Streak continues.
      streak += 1;
    } else {
      break;
    }

    cursorKey = addDaysToKey(cursorKey, -1);
  }

  const longestStreak = Math.max(streak, vitalityState.longestStreak);

  return {
    streak,
    longestStreak,
    freezeTokens: vitalityState.freezeTokens,
    lastActiveDate,
  };
}

// Persist the result to VitalityState. Call this after any score-changing
// mutation (workout finish, nutrition log, vitality recompute).
export async function persistStreak(userId: string): Promise<StreakResult> {
  const result = await recomputeStreak(userId);
  await prisma.vitalityState.update({
    where: { userId },
    data: {
      streak: result.streak,
      longestStreak: result.longestStreak,
      lastActiveDate: result.lastActiveDate,
    },
  });
  return result;
}
