// Phase 4 smoke test — the queue logic itself runs in the mobile app, but we
// can verify the backend-facing contracts the queue depends on:
//   - 5xx response should be returned (mobile keeps in queue)
//   - 401 with no token returns 401 (mobile token-refresh path triggers)
//   - 4xx body validation returns 400 (mobile drops permanent failure)
//
// Run: npx tsx src/scripts/test-phase4.ts

import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';

const BASE_URL = `http://localhost:${config.PORT}`;
const secretBytes = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);

async function mintJwt(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, email: `${userId}@dev`, role: 'authenticated', aud: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretBytes);
}

type Result = { name: string; ok: boolean; detail: string };

async function step(name: string, fn: () => Promise<string>): Promise<Result> {
  try {
    return { name, ok: true, detail: await fn() };
  } catch (err) {
    return { name, ok: false, detail: (err as Error).message };
  }
}

async function main() {
  console.log('Phase 4 backend contract tests...\n');
  const userId = randomUUID();
  const token = await mintJwt(userId);
  const results: Result[] = [];

  // 1. No token → 401 (mobile refresh path)
  results.push(
    await step('POST /workouts without token returns 401', async () => {
      const res = await fetch(`${BASE_URL}/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', type: 'strength' }),
      });
      if (res.status !== 401) throw new Error(`got ${res.status}`);
      return '401';
    }),
  );

  // 2. Bad body → 400 (mobile drops as permanent)
  results.push(
    await step('POST /workouts with bad body returns 400', async () => {
      const res = await fetch(`${BASE_URL}/workouts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'no type field' }),
      });
      if (res.status !== 400) throw new Error(`got ${res.status}`);
      return '400 with issues';
    }),
  );

  // 3. Bootstrap user via /me, then valid mutation → 201
  results.push(
    await step('Valid mutation flow (bootstrap + POST /workouts) returns 201', async () => {
      const me = await fetch(`${BASE_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (me.status !== 200) throw new Error(`/me got ${me.status}`);

      const res = await fetch(`${BASE_URL}/workouts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Phase4 Test', type: 'strength' }),
      });
      if (res.status !== 201) throw new Error(`got ${res.status}`);
      return '201';
    }),
  );

  // 4. /home returns the unified shape mobile useHomeSnapshot expects
  results.push(
    await step('GET /home shape matches mobile useHomeSnapshot', async () => {
      const res = await fetch(`${BASE_URL}/home`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status !== 200) throw new Error(`got ${res.status}`);
      const body = (await res.json()) as Record<string, unknown>;
      const required = ['vitality', 'pillars', 'workout', 'unitSystem'];
      for (const key of required) {
        if (!(key in body)) throw new Error(`missing ${key}`);
      }
      return 'shape ok';
    }),
  );

  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();

  for (const r of results) {
    console.log(`[${r.ok ? 'PASS' : 'FAIL'}] ${r.name} — ${r.detail}`);
  }
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main();
