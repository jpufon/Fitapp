// Connectivity check — verifies each external dependency is reachable.
// Run: npx tsx src/scripts/check-connectivity.ts

import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';

type Result = { name: string; ok: boolean; detail: string };

async function checkPostgres(): Promise<Result> {
  try {
    const rows = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
    return { name: 'Supabase Postgres (Prisma)', ok: true, detail: `server time ${rows[0]?.now.toISOString()}` };
  } catch (err) {
    return { name: 'Supabase Postgres (Prisma)', ok: false, detail: (err as Error).message };
  }
}

async function checkSupabaseAuth(): Promise<Result> {
  try {
    const url = `${config.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/settings`;
    const res = await fetch(url, { headers: { apikey: config.SUPABASE_ANON_KEY } });
    if (!res.ok) {
      return { name: 'Supabase Auth REST', ok: false, detail: `HTTP ${res.status}` };
    }
    const body = (await res.json()) as { external?: Record<string, unknown> };
    const providers = body.external ? Object.keys(body.external).length : 0;
    return { name: 'Supabase Auth REST', ok: true, detail: `${providers} external providers configured` };
  } catch (err) {
    return { name: 'Supabase Auth REST', ok: false, detail: (err as Error).message };
  }
}

async function checkUpstashRedis(): Promise<Result> {
  if (!config.UPSTASH_REDIS_URL || !config.UPSTASH_REDIS_TOKEN) {
    return { name: 'Upstash Redis', ok: false, detail: 'not configured (UPSTASH_REDIS_URL or token empty)' };
  }
  try {
    const url = `${config.UPSTASH_REDIS_URL.replace(/\/$/, '')}/ping`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${config.UPSTASH_REDIS_TOKEN}` } });
    if (!res.ok) {
      return { name: 'Upstash Redis', ok: false, detail: `HTTP ${res.status}` };
    }
    const body = (await res.json()) as { result?: string };
    return { name: 'Upstash Redis', ok: body.result === 'PONG', detail: `response: ${body.result}` };
  } catch (err) {
    return { name: 'Upstash Redis', ok: false, detail: (err as Error).message };
  }
}

async function main() {
  console.log('Running connectivity checks...\n');
  const results = await Promise.all([checkPostgres(), checkSupabaseAuth(), checkUpstashRedis()]);

  for (const r of results) {
    const icon = r.ok ? 'PASS' : 'FAIL';
    console.log(`[${icon}] ${r.name} — ${r.detail}`);
  }

  await prisma.$disconnect();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main();
