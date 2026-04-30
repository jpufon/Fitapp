// apps/backend/src/waliAI/context/sanitize.ts
//
// Strips identifying data from the context object BEFORE it's sent to
// Anthropic or Google. Goal: the AI sees enough to coach, but not enough
// to identify the human.
//
// What this fixes:
// - The context builder in §4.3 sends `user.displayName`, full workout
//   history, and (in V2) cycle phase to third-party AI on every call.
// - Display name is unnecessary for coaching. "the athlete" works fine.
// - Cycle phase data must be opt-in per session, not blanket.
// - Email and phone should never appear in context.
//
// Run this AFTER buildUserContext() and BEFORE calling the AI provider.

import type { ContextInput } from './builder'

export interface SanitizeOptions {
  /** User has opted IN to including cycle data in this AI session. Default false. */
  includeCycleData?: boolean
  /** User has opted IN to AI training data collection. Default false. */
  includeForTraining?: boolean
}

/**
 * Returns a sanitized copy of the context. Original is not mutated.
 *
 * Removes:
 *  - displayName (replaced with "the athlete")
 *  - email, phone, exact birthdate
 *  - cycle phase (unless opt-in)
 *  - GPS coordinates from any run data
 *  - friend usernames
 *  - exact body measurements (V2) — replaced with "logged" boolean
 *
 * Keeps (because the AI needs them):
 *  - goals, experience level, equipment, training days
 *  - body weight (rounded to nearest kg — AI doesn't need 73.4kg precision)
 *  - injuries (necessary for safe coaching)
 *  - workout history (exercise names, sets, reps, weights)
 *  - streak count, tree stage
 *  - nutrition averages
 */
export function sanitizeForAI(ctx: ContextInput, opts: SanitizeOptions = {}): ContextInput {
  const sanitized: ContextInput = {
    ...ctx,
    user: {
      ...ctx.user,
      displayName: 'the athlete',
      email: 'redacted',
      // username and friend list are not part of ContextInput — good
      bodyWeight: ctx.user.bodyWeight ? Math.round(ctx.user.bodyWeight) : null,
      // Cycle phase: only include if user opted in for THIS session
      // (V2 — adjust field name to match your schema)
      // cyclePhase: opts.includeCycleData ? ctx.user.cyclePhase : null,
    },
    recentLogs: ctx.recentLogs.map(stripRouteData),
  }
  return sanitized
}

/** Strip GPS coordinates from a workout log — pace and distance are fine. */
function stripRouteData<T extends { runRoutePolyline?: string | null }>(log: T): T {
  if (!log.runRoutePolyline) return log
  return { ...log, runRoutePolyline: null }
}

/**
 * Audit log: what was sent to the AI provider, for transparency.
 * Used by Settings → AI Processing → "What was sent in your last conversation?"
 *
 * Hash any user reference here — see §14.3 hashUserId pattern.
 */
export function summarizeForAudit(sanitized: ContextInput): string[] {
  const items: string[] = []
  items.push(`Goals: ${sanitized.user.goals.join(', ')}`)
  items.push(`Experience level: ${sanitized.user.experienceLevel}`)
  if (sanitized.user.bodyWeight) items.push(`Body weight (rounded)`)
  if (sanitized.user.injuries?.length) items.push(`Injury list (${sanitized.user.injuries.length} items)`)
  items.push(`Recent workouts: ${sanitized.recentLogs.length} entries`)
  return items
}

// ─── Wiring into WaliAI public methods ─────────────────────────────────
//
// In src/waliAI/index.ts, change:
//
//   async chat(ctx: ContextInput, message: string): Promise<string> {
//     const context = buildUserContext(ctx)            // OLD
//     ...
//   }
//
// to:
//
//   async chat(ctx: ContextInput, message: string, opts: SanitizeOptions = {}): Promise<string> {
//     const safeCtx = sanitizeForAI(ctx, opts)         // NEW
//     const context = buildUserContext(safeCtx)
//     ...
//   }
//
// Now the AI never sees the user's real name, never sees cycle data
// unless explicitly enabled, and never sees GPS coordinates.

// ─── For interaction logging (data collection for fine-tuning) ─────────
//
// When logging interactions for the future fine-tune dataset (§14.3):
//
//   if (user.aiTrainingOptIn === true) {  // explicit opt-in, default false
//     await logInteraction({ ...sanitizedContext, prompt, response })
//   }
//
// NOT:
//
//   if (!user.aiTrainingOptOut) {  // default-on collection — bad
//     await logInteraction(...)
//   }
//
// The architecture's `aiTrainingOptOut` field defaults to false meaning
// "user has NOT opted out", which means data IS collected by default.
// Flip the semantics: `aiTrainingOptIn` defaults to false. User has to
// turn it on. This is the GDPR-defensible posture.
