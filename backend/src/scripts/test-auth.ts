// Auth round-trip test — forges a valid Supabase JWT and hits /me.
// Run: npx tsx src/scripts/test-auth.ts
//
// This proves the JWT middleware works end-to-end without needing a real
// signed-in mobile user. We mint a token using SUPABASE_JWT_SECRET, the same
// secret Supabase Auth uses, so the token is structurally identical to one
// the mobile app would get from supabase.auth.signIn().

import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';

const BASE_URL = `http://localhost:${config.PORT}`;
const secretBytes = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);

async function mintTestJwt(userId: string, email: string): Promise<string> {
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

type Result = { name: string; ok: boolean; detail: string };

async function check(name: string, fn: () => Promise<string>): Promise<Result> {
  try {
    const detail = await fn();
    return { name, ok: true, detail };
  } catch (err) {
    return { name, ok: false, detail: (err as Error).message };
  }
}

async function main() {
  console.log('Running auth round-trip tests...\n');

  const results: Result[] = [];

  // 1. /me without token → 401
  results.push(
    await check('GET /me without token returns 401', async () => {
      const res = await fetch(`${BASE_URL}/me`);
      if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
      return `status ${res.status} as expected`;
    }),
  );

  // 2. /me with bad token → 401
  results.push(
    await check('GET /me with bogus token returns 401', async () => {
      const res = await fetch(`${BASE_URL}/me`, {
        headers: { Authorization: 'Bearer not.a.real.jwt' },
      });
      if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
      return `status ${res.status} as expected`;
    }),
  );

  // 3. /me with valid token → 200 + user upserted
  const testUserId = randomUUID();
  const testEmail = `test-${testUserId.slice(0, 8)}@walifit.dev`;

  results.push(
    await check('GET /me with valid JWT returns 200 + upserts user', async () => {
      const token = await mintTestJwt(testUserId, testEmail);
      const res = await fetch(`${BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status !== 200) {
        const body = await res.text();
        throw new Error(`expected 200, got ${res.status}: ${body}`);
      }
      const body = (await res.json()) as { user: { id: string; email: string | null } };
      if (body.user.id !== testUserId) {
        throw new Error(`expected user.id ${testUserId}, got ${body.user.id}`);
      }
      if (body.user.email !== testEmail) {
        throw new Error(`expected email ${testEmail}, got ${body.user.email}`);
      }
      return `user ${testUserId.slice(0, 8)}... upserted`;
    }),
  );

  // Cleanup — delete the test user we just upserted
  try {
    await prisma.user.delete({ where: { id: testUserId } });
  } catch {
    // ignore — user may not exist if test 3 failed
  }
  await prisma.$disconnect();

  for (const r of results) {
    console.log(`[${r.ok ? 'PASS' : 'FAIL'}] ${r.name} — ${r.detail}`);
  }

  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main();
