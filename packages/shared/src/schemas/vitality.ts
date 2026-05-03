import { z } from 'zod';

export const TreeStateEnum = z.enum([
  'wilted',
  'recovering',
  'sprout',
  'growing',
  'thriving',
  'full_vitality',
]);
export type TreeState = z.infer<typeof TreeStateEnum>;

// ─── POST /vitality/recompute ──────────────────────────────────────────────
// Body optional — if date omitted, server uses today in user's timezone.

export const RecomputeVitalitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD').optional(),
  isRestDay: z.boolean().optional(),
});
export type RecomputeVitalityBody = z.infer<typeof RecomputeVitalitySchema>;

// ─── POST /vitality/freeze ─────────────────────────────────────────────────
// Burns one freeze token to mark the given date as a streak-protected day.

export const UseFreezeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
});
export type UseFreezeBody = z.infer<typeof UseFreezeSchema>;
