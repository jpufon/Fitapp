// Fixed-window counter rate limiter backed by Upstash Redis.
//
// Why fixed window: at our scale (200k MAU target) it is plenty accurate and
// trivially cheap (one INCR + one EXPIRE per first hit per window). Sliding
// window adds complexity that does not pay back yet.
//
// Failure mode: if Redis is unreachable or unconfigured, every check returns
// `ok`. The whole point is to protect against runaway clients, not to enforce
// auth. Failing open keeps legitimate users moving during a cache outage.
//
// See docs/SYSTEM_DESIGN.md §4.2 for the bucket table and rationale.

import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { redis, isRedisConfigured } from './redis.js';

export type RateLimitResult = {
  ok: boolean;
  retryAfterS: number;
  /** True when the limiter is offline; the request was allowed by failing open. */
  bypassed?: boolean;
};

/**
 * Increment the bucket for `(scope, subjectId)` in the current fixed window.
 * Returns whether the request is under the limit.
 */
export async function checkLimit(
  scope: string,
  subjectId: string,
  limit: number,
  windowS: number,
): Promise<RateLimitResult> {
  if (!isRedisConfigured || !redis) {
    return { ok: true, retryAfterS: 0, bypassed: true };
  }

  const nowS = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(nowS / windowS);
  const key = `rl:${scope}:${subjectId}:${bucket}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      // First write of this window — set the TTL so the key cleans itself up.
      await redis.expire(key, windowS);
    }
    if (count > limit) {
      const retryAfterS = windowS - (nowS % windowS);
      return { ok: false, retryAfterS };
    }
    return { ok: true, retryAfterS: 0 };
  } catch {
    // Redis flaked — fail open. Caller logs the bypass via `bypassed: true`.
    return { ok: true, retryAfterS: 0, bypassed: true };
  }
}

/**
 * Fastify preHandler factory. Use after `requireAuth` so `request.user.id`
 * is populated. Subject is the authed user id; for unauthenticated routes
 * (login/signup), use `rateLimitByIp` instead.
 */
export const rateLimit = (
  scope: string,
  limit: number,
  windowS: number,
): preHandlerHookHandler => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user?.id;
    if (!userId) return; // requireAuth should have rejected; nothing to limit on.

    const result = await checkLimit(scope, userId, limit, windowS);

    if (result.bypassed) {
      request.log.warn({ scope, userId }, 'rate_limit_bypassed');
    }

    if (!result.ok) {
      reply.header('Retry-After', String(result.retryAfterS));
      return reply.code(429).send({
        error: 'rate_limited',
        scope,
        retryAfterS: result.retryAfterS,
      });
    }
  };
};

/**
 * Per-IP variant for unauthenticated routes (login, signup, password reset).
 * Subject is the client IP. Behind a proxy (Railway), Fastify reports the
 * forwarded IP when `trustProxy` is enabled — verify this is set in server.ts
 * before relying on it for prod.
 */
export const rateLimitByIp = (
  scope: string,
  limit: number,
  windowS: number,
): preHandlerHookHandler => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip;
    if (!ip) return;

    const result = await checkLimit(scope, ip, limit, windowS);

    if (result.bypassed) {
      request.log.warn({ scope, ip }, 'rate_limit_bypassed');
    }

    if (!result.ok) {
      reply.header('Retry-After', String(result.retryAfterS));
      return reply.code(429).send({
        error: 'rate_limited',
        scope,
        retryAfterS: result.retryAfterS,
      });
    }
  };
};
