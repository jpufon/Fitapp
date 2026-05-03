// Upstash Redis HTTP client. Used for rate limiting (and later, the
// Idempotency-Key fallback layer described in docs/SYSTEM_DESIGN.md).
//
// We treat Redis as a soft dependency: when UPSTASH_REDIS_URL is missing
// (local dev without an Upstash account, or Upstash is unreachable), every
// helper that talks to it must fail open. Better to serve traffic than to
// block legitimate users on a cache outage.

import { Redis } from '@upstash/redis';
import { config } from '../config.js';

let client: Redis | null = null;

if (config.UPSTASH_REDIS_URL && config.UPSTASH_REDIS_TOKEN) {
  client = new Redis({
    url: config.UPSTASH_REDIS_URL,
    token: config.UPSTASH_REDIS_TOKEN,
  });
}

export const redis = client;
export const isRedisConfigured = client !== null;
