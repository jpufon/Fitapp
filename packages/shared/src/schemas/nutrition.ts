import { z } from 'zod';

// ─── POST /nutrition/simple/:date ──────────────────────────────────────────
// Sets cumulative values for the day. Mobile reads current + new total then posts.
// All fields optional — pass only what changed.

export const LogNutritionSchema = z.object({
  proteinG: z.number().int().min(0).max(2000).optional(),
  waterMl: z.number().int().min(0).max(20000).optional(),
  stepsCount: z.number().int().min(0).max(200000).optional(),
});
export type LogNutritionBody = z.infer<typeof LogNutritionSchema>;
