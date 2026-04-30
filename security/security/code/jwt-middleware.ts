// apps/backend/src/middleware/auth.ts
//
// Portable JWT verification — works with Supabase Auth today, swappable
// to Clerk / Cognito / BetterAuth tomorrow without changing route handlers.
//
// What this fixes:
// 1. Architecture §13.2 says use this pattern. Make sure it actually IS
//    this pattern and not `supabase.auth.getUser()` somewhere.
// 2. Supabase JWTs are HS256-signed with the project's JWT secret. We
//    verify with that secret directly — never call back to Supabase on
//    every request (that's a network hop per request and a vendor lock-in).
//
// IMPORTANT: This file should be the ONLY place in the backend that
// touches `jsonwebtoken` or `jwt.verify`. Every route uses
// `preHandler: [fastify.authenticate]`.

import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify'
import jwt from 'jsonwebtoken'
import fp from 'fastify-plugin'

interface JwtPayload {
  sub: string         // user id (Supabase puts it here)
  email?: string
  role?: string
  exp: number
  iat: number
  iss?: string        // issuer — verify it's Supabase if we want to be strict
}

declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string; email?: string }
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Refusing to start.')
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET is too short. Use a 32+ byte random secret.')
  }

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or malformed authorization header' })
    }

    const token = header.slice('Bearer '.length).trim()

    let payload: JwtPayload
    try {
      payload = jwt.verify(token, secret, {
        algorithms: ['HS256'], // explicit — never accept 'none'
        // If you want to lock to a specific issuer:
        // issuer: process.env.JWT_ISSUER
      }) as JwtPayload
    } catch (err: any) {
      // Don't leak internal details in the response
      request.log.warn({ err: err.message }, 'JWT verification failed')
      return reply.status(401).send({ error: 'Invalid or expired token' })
    }

    if (!payload.sub) {
      return reply.status(401).send({ error: 'Token missing subject' })
    }

    request.user = { id: payload.sub, email: payload.email }
  })
}

export default fp(authPlugin, { name: 'auth' })

// ─── Anti-patterns to grep for and remove ──────────────────────────────
//
//   import { createClient } from '@supabase/supabase-js'
//   ...supabase.auth.getUser(token)               ← DO NOT do this in middleware
//   ...supabase.auth.admin.getUserById(...)       ← DO NOT in hot path
//
// Supabase admin calls are fine for one-off operations (deleting an account,
// resetting a password). They are NOT for per-request auth.

// ─── Refresh token revocation ──────────────────────────────────────────
//
// Supabase handles refresh tokens. When a user logs out:
//   await supabase.auth.admin.signOut(userId)
// This invalidates all their refresh tokens. Existing access tokens will
// continue to work until they expire (default 1 hour) — that's why short
// access TTLs matter. Setting access token TTL is a Supabase project setting.

// ─── How to swap providers later ───────────────────────────────────────
//
// Clerk: change `algorithms: ['HS256']` to `algorithms: ['RS256']` and
//   load Clerk's JWKS instead of a single secret. Use jose or
//   express-jwt-jwks for JWKS handling.
// Cognito: same as Clerk — RS256 + JWKS endpoint.
// BetterAuth: same as Supabase if you self-host with HS256.
//
// In all three cases, route handlers are unchanged. They only see
// request.user.id.
