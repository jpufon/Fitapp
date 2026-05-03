import { z } from 'zod';

// ─── POST /nutrition/simple/:date ──────────────────────────────────────────
// Additive logging. Mobile mints `clientId` (UUID v4) per tap; the server uses
// it as the idempotency key — replays collapse to a single ledger row.
// Steps stays absolute (pedometer reports cumulative); protein/water are deltas.

export const LogNutritionSchema = z
  .object({
    clientId: z.string().min(1).max(64),
    proteinDeltaG: z.number().int().min(-2000).max(2000).optional(),
    waterDeltaMl: z.number().int().min(-20000).max(20000).optional(),
    stepsCount: z.number().int().min(0).max(200000).optional(),
  })
  .refine(
    (v) =>
      v.proteinDeltaG !== undefined ||
      v.waterDeltaMl !== undefined ||
      v.stepsCount !== undefined,
    { message: 'at_least_one_field_required' },
  );

export type LogNutritionBody = z.infer<typeof LogNutritionSchema>;
