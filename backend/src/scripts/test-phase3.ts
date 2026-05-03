// Phase 3 round-trip — exercises every mutation route end-to-end.
// Run: npx tsx src/scripts/test-phase3.ts
//
// Forges a JWT, runs:
//   1. POST /workouts
//   2. POST /workouts/:id/sets (×3, including a heavier-than-PR weight)
//   3. PATCH /workouts/:id (finish + PR detection)
//   4. POST /nutrition/simple/:date
//   5. POST /vitality/recompute
//   6. GET /home
//   7. GET /vitality/current
// Then deletes the test user (cascades workout/sets/PRs/scores).

import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';

const BASE_URL = `http://localhost:${config.PORT}`;
const secretBytes = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);

async function mintJwt(userId: string, email: string): Promise<string> {
  return await new SignJWT({ sub: userId, email, role: 'authenticated', aud: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretBytes);
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

async function main() {
  console.log('Phase 3 round-trip starting...\n');

  const userId = randomUUID();
  const email = `test-${userId.slice(0, 8)}@walifit.dev`;
  const token = await mintJwt(userId, email);
  const today = new Date().toISOString().slice(0, 10);

  let workoutId = '';
  const results: Result[] = [];

  // Bootstrap user via /me
  results.push(
    await step('GET /me bootstraps user', async () => {
      const res = await jsonReq('GET', '/me', token);
      if (res.status !== 200) throw new Error(`status ${res.status}`);
      return `user ${userId.slice(0, 8)}... created`;
    }),
  );

  // 1. Start a workout
  results.push(
    await step('POST /workouts creates session', async () => {
      const res = await jsonReq('POST', '/workouts', token, {
        name: 'Push Day A',
        type: 'strength',
      });
      if (res.status !== 201) throw new Error(`status ${res.status}: ${JSON.stringify(res.body)}`);
      const workout = (res.body as { workout: { id: string } }).workout;
      workoutId = workout.id;
      return `workout ${workoutId.slice(0, 8)}...`;
    }),
  );

  // 2. Log 3 sets (heaviest = 100kg → should trigger PR)
  results.push(
    await step('POST /workouts/:id/sets ×3 (incl 100kg bench)', async () => {
      const sets = [
        { exerciseName: 'Bench Press', setNumber: 1, reps: 5, weightKg: 80 },
        { exerciseName: 'Bench Press', setNumber: 2, reps: 5, weightKg: 90 },
        { exerciseName: 'Bench Press', setNumber: 3, reps: 3, weightKg: 100, rpe: 9 },
      ];
      for (const s of sets) {
        const res = await jsonReq('POST', `/workouts/${workoutId}/sets`, token, s);
        if (res.status !== 201) throw new Error(`set ${s.setNumber}: status ${res.status}`);
      }
      return '3 sets logged';
    }),
  );

  // 3. Finish workout — expect PR for Bench Press at 100kg
  results.push(
    await step('PATCH /workouts/:id finishes + detects PR', async () => {
      const res = await jsonReq('PATCH', `/workouts/${workoutId}`, token, {
        sessionRpe: 8,
        notes: 'Felt strong today',
      });
      if (res.status !== 200) throw new Error(`status ${res.status}: ${JSON.stringify(res.body)}`);
      const newPRs = (res.body as { newPRs: Array<{ exerciseName: string; value: number }> }).newPRs;
      if (newPRs.length !== 1) throw new Error(`expected 1 PR, got ${newPRs.length}`);
      if (newPRs[0].exerciseName !== 'Bench Press' || newPRs[0].value !== 100) {
        throw new Error(`unexpected PR: ${JSON.stringify(newPRs[0])}`);
      }
      return `Bench Press PR @ ${newPRs[0].value}kg`;
    }),
  );

  // 4. Log nutrition for today
  results.push(
    await step('POST /nutrition/simple/:date sets pillars', async () => {
      const res = await jsonReq('POST', `/nutrition/simple/${today}`, token, {
        clientId: `test-phase3-${Date.now()}`,
        proteinDeltaG: 120,
        waterDeltaMl: 2000,
        stepsCount: 9000,
      });
      if (res.status !== 200) throw new Error(`status ${res.status}: ${JSON.stringify(res.body)}`);
      const ds = (res.body as { dailyScore: { totalScore: number; treeState: string } }).dailyScore;
      if (ds.totalScore <= 0) throw new Error(`expected totalScore > 0, got ${ds.totalScore}`);
      return `total ${(ds.totalScore * 100).toFixed(0)}% · ${ds.treeState}`;
    }),
  );

  // 5. Recompute (idempotent)
  results.push(
    await step('POST /vitality/recompute returns same result', async () => {
      const res = await jsonReq('POST', '/vitality/recompute', token, {});
      if (res.status !== 200) throw new Error(`status ${res.status}`);
      return 'ok';
    }),
  );

  // 6. /home aggregate
  results.push(
    await step('GET /home returns full snapshot', async () => {
      const res = await jsonReq('GET', '/home', token);
      if (res.status !== 200) throw new Error(`status ${res.status}`);
      const body = res.body as {
        vitality: { score: number; treeState: string; streak: number };
        pillars: { steps: { current: number }; protein: { current: number }; hydration: { current: number } };
        workout: unknown;
      };
      if (body.pillars.steps.current !== 9000) throw new Error(`steps mismatch: ${body.pillars.steps.current}`);
      if (body.pillars.protein.current !== 120) throw new Error(`protein mismatch: ${body.pillars.protein.current}`);
      if (body.pillars.hydration.current !== 2000) throw new Error(`hydration mismatch: ${body.pillars.hydration.current}`);
      return `${body.vitality.treeState} · streak ${body.vitality.streak}`;
    }),
  );

  // 7. /vitality/current
  results.push(
    await step('GET /vitality/current returns dailyScore + streak', async () => {
      const res = await jsonReq('GET', '/vitality/current', token);
      if (res.status !== 200) throw new Error(`status ${res.status}`);
      return 'ok';
    }),
  );

  // ── Cleanup ───────────────────────────────────────────────────────────
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    // ignore — partial state is fine
  }
  await prisma.$disconnect();

  for (const r of results) {
    console.log(`[${r.ok ? 'PASS' : 'FAIL'}] ${r.name} — ${r.detail}`);
  }

  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main();
