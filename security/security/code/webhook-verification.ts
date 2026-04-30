// apps/backend/src/routes/webhooks.ts
//
// V2.5 ships subscriptions via RevenueCat (iOS + Android) and Stripe
// (web payments). Both POST webhooks to your backend to grant/revoke
// subscription access.
//
// What this fixes: without signature verification, anyone who guesses
// your webhook URL can POST a forged "subscription_active" event and
// unlock premium features. This is THE most common monetization bypass.
//
// Both providers sign their webhooks; you just have to verify.

import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import crypto from 'crypto'
import Stripe from 'stripe'

// ─── 1. STRIPE — built-in helper ───────────────────────────────────────
//
// CRITICAL: Stripe verifies against the RAW body. Fastify's default JSON
// parser destroys the raw body. Register a separate parser for the
// webhook route ONLY:
//
//   fastify.addContentTypeParser(
//     'application/json',
//     { parseAs: 'buffer' },
//     (req, body, done) => done(null, body),  // keep raw
//   )
//
// ...or use a route-specific parser. See Stripe + Fastify docs.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-20.acacia' })

const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/stripe', {
    config: { rawBody: true }, // tell Fastify to keep raw body
  }, async (request: FastifyRequest, reply) => {
    const sig = request.headers['stripe-signature']
    if (!sig || typeof sig !== 'string') {
      return reply.status(400).send({ error: 'Missing signature' })
    }

    const rawBody = (request.body as Buffer)
    const secret = process.env.STRIPE_WEBHOOK_SECRET!

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret)
    } catch (err: any) {
      request.log.warn({ err: err.message }, 'Stripe signature verification failed')
      return reply.status(400).send({ error: 'Invalid signature' })
    }

    // Now safe to act on the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // grant access
        break
      case 'customer.subscription.deleted':
        // revoke access
        break
    }
    return reply.send({ received: true })
  })

  // ─── 2. REVENUECAT — HMAC-SHA256 with shared secret ───────────────────
  //
  // RevenueCat signs the body with a shared secret using HMAC-SHA256.
  // Header name: `Authorization: Bearer <secret>` OR a custom header
  // depending on your RC config. Check the current RC docs — they've
  // changed format twice in two years.
  //
  // Below: generic HMAC pattern. Adjust the header name to whatever RC
  // is currently sending.

  fastify.post('/revenuecat', {
    config: { rawBody: true },
  }, async (request: FastifyRequest, reply) => {
    const provided = request.headers['authorization']
    const expected = process.env.REVENUECAT_WEBHOOK_SECRET!
    if (!provided || typeof provided !== 'string') {
      return reply.status(401).send({ error: 'Missing authorization' })
    }

    // Constant-time comparison — never use === on secrets
    const providedBuf = Buffer.from(provided.replace(/^Bearer\s+/, ''), 'utf8')
    const expectedBuf = Buffer.from(expected, 'utf8')
    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      return reply.status(401).send({ error: 'Invalid authorization' })
    }

    const event = JSON.parse((request.body as Buffer).toString())
    // event.event.type is one of: INITIAL_PURCHASE, RENEWAL, CANCELLATION,
    //   EXPIRATION, BILLING_ISSUE, PRODUCT_CHANGE, TRANSFER, NON_RENEWING_PURCHASE
    return reply.send({ received: true })
  })
}

export default webhookRoutes

// ─── Sanity tests for CI ───────────────────────────────────────────────
//
// Add to your test suite:
//
//   it('rejects Stripe webhook with no signature', async () => {
//     const res = await app.inject({ method: 'POST', url: '/webhooks/stripe', payload: '{}' })
//     expect(res.statusCode).toBe(400)
//   })
//
//   it('rejects Stripe webhook with bad signature', async () => {
//     const res = await app.inject({
//       method: 'POST', url: '/webhooks/stripe',
//       headers: { 'stripe-signature': 't=123,v1=garbage' },
//       payload: '{"type":"customer.subscription.created"}',
//     })
//     expect(res.statusCode).toBe(400)
//   })
//
//   it('rejects RC webhook with bad bearer', async () => {
//     const res = await app.inject({
//       method: 'POST', url: '/webhooks/revenuecat',
//       headers: { authorization: 'Bearer wrong' },
//       payload: '{}',
//     })
//     expect(res.statusCode).toBe(401)
//   })

// ─── Idempotency reminder ──────────────────────────────────────────────
//
// Webhooks retry on failure. Your handler MUST be idempotent.
// Check `event.id` against a `processed_webhooks` table before acting.
// Otherwise a slow response triggers a retry, granting subscription twice.
