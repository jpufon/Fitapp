// 🚦 Sprint 3 validation gate — WF-023.
// Five mandatory scenarios + a DST bonus must pass before Sprint 4 starts.
//
// Run: npx tsx src/scripts/testValidationGate.ts  (or: npm run test:gate)
//
// Setup: mints a JWT, creates a fresh test user, runs each scenario in
// isolation, then deletes the user. Past DailyScore rows are written
// directly via Prisma so we can simulate multi-day history without
// time-travel.

import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import {
  addDaysToKey,
  currentDayKeyWithGrace,
  dayKeyToDbDate,
  dayKeyInTz,
  persistStreak,
} from '../lib/streakEngine.js';
import { computeScore } from '../lib/score.js';

const BASE_URL = `http://localhost:${config.PORT}`;
const secretBytes = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);

async function mintJwt(userId: string, email: string): Promise<string> {
  return await new SignJWT({
    sub: userId,
    email,
    role: 'authenticated',
    aud: 'authenticated',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretBytes);
}

async function jsonReq(method: string, path: string, token: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed as Record<string, unknown> };
}

type Result = { name: string; ok: boolean; detail: string };

async function step(name: string, fn: () => Promise<string>): Promise<Result> {
  try {
    const detail = await fn();
    return { name, ok: true, detail };
  } catch (err) {
    return { name, ok: false, detail: (err as Error).message };
  }
}

function assert(cond: boolean, message: string): void {
  if (!cond) throw new Error(message);
}

function approx(actual: number, expected: number, epsilon = 0.001): boolean {
  return Math.abs(actual - expected) < epsilon;
}

// ── Direct-write helpers ───────────────────────────────────────────────────

async function writeDailyScore(
  userId: string,
  dayKey: string,
  pillars: { stepsCount: number; proteinG: number; waterMl: number; isRestDay?: boolean },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stepsGoal: true, proteinTargetG: true, waterTargetMl: true },
  });
  if (!user) throw new Error('user_not_found');

  const merged = {
    stepsCount: pillars.stepsCount,
    stepsGoal: user.stepsGoal,
    proteinG: pillars.proteinG,
    proteinTargetG: user.proteinTargetG,
    waterMl: pillars.waterMl,
    waterTargetMl: user.waterTargetMl,
    isRestDay: pillars.isRestDay ?? false,
  };
  const computed = computeScore(merged);

  await prisma.dailyScore.upsert({
    where: { userId_date: { userId, date: dayKeyToDbDate(dayKey) } },
    update: { ...merged, ...computed },
    create: { userId, date: dayKeyToDbDate(dayKey), ...merged, ...computed },
  });
}

async function clearUserHistory(userId: string) {
  await prisma.dailyScore.deleteMany({ where: { userId } });
  await prisma.nutritionEntry.deleteMany({ where: { userId } });
  await prisma.simpleNutritionLog.deleteMany({ where: { userId } });
  await prisma.vitalityState.update({
    where: { userId },
    data: {
      streak: 0,
      longestStreak: 0,
      freezeTokens: 0,
      lastFreezeAwardedStreak: 0,
      lastActiveDate: null,
      treeHealth: 100,
      treeStage: 'sprout',
    },
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚦 Sprint 3 validation gate — starting\n');

  const userId = randomUUID();
  const email = `gate-${userId.slice(0, 8)}@walifit.dev`;
  const token = await mintJwt(userId, email);

  const results: Result[] = [];

  // Bootstrap user via /me — also creates the VitalityState row.
  results.push(
    await step('bootstrap user', async () => {
      const res = await jsonReq('GET', '/me', token);
      if (res.status !== 200) throw new Error(`status ${res.status}`);
      // Treat every day as a training day so the streak walk-back terminates
      // exactly when we run out of written rows (no implicit weekend extension).
      // S2/S3 are pure-function tests that pass isRestDay explicitly, so they
      // are unaffected by this.
      await prisma.user.update({
        where: { id: userId },
        data: { trainingDays: [0, 1, 2, 3, 4, 5, 6] },
      });
      return `user ${userId.slice(0, 8)} ready`;
    }),
  );

  // Use the user's tz so all key arithmetic agrees with the server.
  const vitality = await prisma.vitalityState.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  const tz = vitality?.timezone || 'UTC';
  const todayKey = currentDayKeyWithGrace(tz);

  // ─── Scenario 1: 7 perfect days → full vitality + token earned ──────────
  results.push(
    await step('S1 · 7 perfect days → streak 7, token 1, full vitality, treeHealth 100', async () => {
      await clearUserHistory(userId);
      // Write today + 6 previous days, all fully hit.
      for (let i = 0; i < 7; i += 1) {
        const key = addDaysToKey(todayKey, -i);
        await writeDailyScore(userId, key, {
          stepsCount: 10000,
          proteinG: 200,
          waterMl: 3000,
        });
      }
      const result = await persistStreak(userId);
      const state = await prisma.vitalityState.findUnique({ where: { userId } });
      assert(result.streak === 7, `expected streak=7, got ${result.streak}`);
      assert(result.freezeTokens === 1, `expected tokens=1, got ${result.freezeTokens}`);
      assert(state?.treeStage === 'full_vitality', `expected full_vitality, got ${state?.treeStage}`);
      assert(state?.treeHealth === 100, `expected treeHealth=100, got ${state?.treeHealth}`);
      return `streak=${result.streak} tokens=${result.freezeTokens} stage=${state?.treeStage} health=${state?.treeHealth}`;
    }),
  );

  // ─── Scenario 2: rest day with full nutrition → 0.80, thriving (per-day) ──
  results.push(
    await step('S2 · miss-activity rest day → stepsScore 0.5, totalScore 0.80, thriving', async () => {
      const computed = computeScore({
        stepsCount: 2000,
        stepsGoal: 10000,
        proteinG: 200,
        proteinTargetG: 200,
        waterMl: 3000,
        waterTargetMl: 3000,
        isRestDay: true,
      });
      assert(approx(computed.stepsScore, 0.5), `stepsScore=${computed.stepsScore}`);
      assert(approx(computed.totalScore, 0.80), `totalScore=${computed.totalScore}`);
      assert(computed.treeState === 'thriving', `treeState=${computed.treeState}`);
      return `total=${computed.totalScore.toFixed(2)} stage=${computed.treeState}`;
    }),
  );

  // ─── Scenario 3: training day with zero protein → 0.70, growing ─────────
  results.push(
    await step('S3 · miss-protein training day → proteinScore 0, totalScore 0.70, growing', async () => {
      const computed = computeScore({
        stepsCount: 10000,
        stepsGoal: 10000,
        proteinG: 0,
        proteinTargetG: 200,
        waterMl: 3000,
        waterTargetMl: 3000,
        isRestDay: false,
      });
      assert(approx(computed.proteinScore, 0), `proteinScore=${computed.proteinScore}`);
      assert(approx(computed.totalScore, 0.70), `totalScore=${computed.totalScore}`);
      assert(computed.treeState === 'growing', `treeState=${computed.treeState}`);
      return `total=${computed.totalScore.toFixed(2)} stage=${computed.treeState}`;
    }),
  );

  // ─── Scenario 4: freeze token saves a missed day ────────────────────────
  results.push(
    await step('S4 · freeze token consumed → streak survives the miss', async () => {
      await clearUserHistory(userId);
      // 7 perfect days T-7..T-1 (so streak is exactly 7 going INTO today).
      for (let i = 1; i <= 7; i += 1) {
        const key = addDaysToKey(todayKey, -i);
        await writeDailyScore(userId, key, {
          stepsCount: 10000,
          proteinG: 200,
          waterMl: 3000,
        });
      }
      // Today: only 0.2 → would break the streak without a freeze.
      await writeDailyScore(userId, todayKey, {
        stepsCount: 2000,
        proteinG: 0,
        waterMl: 0,
      });

      // Model: user already hit the 7-day milestone (lastFreezeAwardedStreak=7)
      // and is sitting on the one token they earned. Burning today's freeze
      // grows the streak to 8 — NOT a new milestone, so no re-award.
      await prisma.vitalityState.update({
        where: { userId },
        data: { freezeTokens: 1, lastFreezeAwardedStreak: 7 },
      });

      const burn = await jsonReq('POST', '/vitality/freeze', token, { date: todayKey });
      if (burn.status !== 200) throw new Error(`freeze status ${burn.status}: ${JSON.stringify(burn.body)}`);
      const burnBody = burn.body as { burned: boolean; freezeTokens: number; streak: number };
      assert(burnBody.burned === true, `expected burned=true, got ${burnBody.burned}`);
      assert(burnBody.freezeTokens === 0, `expected tokens=0, got ${burnBody.freezeTokens}`);
      // Walk-back: today (frozen) + T-1..T-7 (full) = streak 8.
      assert(burnBody.streak === 8, `expected streak=8, got ${burnBody.streak}`);

      const todayRow = await prisma.dailyScore.findUnique({
        where: { userId_date: { userId, date: dayKeyToDbDate(todayKey) } },
        select: { isFreezeDay: true },
      });
      assert(todayRow?.isFreezeDay === true, `expected today.isFreezeDay=true`);
      return `streak=${burnBody.streak} tokens=${burnBody.freezeTokens} frozen=${todayRow?.isFreezeDay}`;
    }),
  );

  // ─── Scenario 5: timezone grace window (LA, 01:55 local) ────────────────
  results.push(
    await step('S5 · tz grace window → late-night log counts as previous day', async () => {
      // 2026-05-02 09:55 UTC = 02:55 May 1 LA … wait, 09:55 UTC = 02:55 LA which
      // is past 02:00 grace. Use 09:00 UTC = 02:00 LA edge → still > grace.
      // Pick 08:00 UTC = 01:00 LA, well inside grace.
      const ny = new Date('2026-05-02T08:00:00.000Z');
      const key = currentDayKeyWithGrace('America/Los_Angeles', ny);
      assert(key === '2026-05-01', `expected 2026-05-01, got ${key}`);

      // After grace window, key should be 2026-05-02.
      const morning = new Date('2026-05-02T17:00:00.000Z'); // 10:00 LA
      const key2 = currentDayKeyWithGrace('America/Los_Angeles', morning);
      assert(key2 === '2026-05-02', `expected 2026-05-02, got ${key2}`);
      return `01:00 LA → ${key} · 10:00 LA → ${key2}`;
    }),
  );

  // ─── Scenario 6 (BONUS): DST spring-forward 2026-03-08 LA ───────────────
  results.push(
    await step('S6 · DST spring-forward → day-key arithmetic stable', async () => {
      // Spring forward 2026-03-08 02:00 LA — the 02:00 hour vanishes.
      const beforeKey = '2026-03-07';
      const afterKey = '2026-03-08';
      const next = addDaysToKey(beforeKey, 1);
      assert(next === afterKey, `expected ${afterKey}, got ${next}`);

      // 12:00 UTC on 2026-03-08 = 05:00 LA (after DST shift) — should map to 03-08.
      const noonUtc = new Date('2026-03-08T12:00:00.000Z');
      const key = dayKeyInTz(noonUtc, 'America/Los_Angeles');
      assert(key === '2026-03-08', `expected 2026-03-08 in LA, got ${key}`);

      // 23:30 UTC on 2026-03-07 = 15:30 LA before DST — should still map to 03-07.
      const eveUtc = new Date('2026-03-07T23:30:00.000Z');
      const evKey = dayKeyInTz(eveUtc, 'America/Los_Angeles');
      assert(evKey === '2026-03-07', `expected 2026-03-07 in LA, got ${evKey}`);
      return `before+1=${next} · 03-08T12 UTC LA=${key} · 03-07T23:30 UTC LA=${evKey}`;
    }),
  );

  // ─── Cleanup ───────────────────────────────────────────────────────────
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    // partial state OK
  }
  await prisma.$disconnect();

  console.log();
  for (const r of results) {
    console.log(`[${r.ok ? 'PASS' : 'FAIL'}] ${r.name} — ${r.detail}`);
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n🚦 ${passed}/${results.length} gate scenarios passed`);
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main();
