import { z } from 'zod';

export const WorkoutTypeEnum = z.enum(['strength', 'hybrid', 'conditioning', 'run', 'rest']);
export type WorkoutType = z.infer<typeof WorkoutTypeEnum>;

export const RunTypeEnum = z.enum(['free', 'preset']);
export type RunType = z.infer<typeof RunTypeEnum>;

export const RunDistancePresetEnum = z.enum(['one_mile', 'two_mile', 'three_mile', 'two_k', 'five_k']);
export type RunDistancePreset = z.infer<typeof RunDistancePresetEnum>;

// ─── POST /workouts ────────────────────────────────────────────────────────

export const StartWorkoutSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  type: WorkoutTypeEnum,
});
export type StartWorkoutBody = z.infer<typeof StartWorkoutSchema>;

// ─── POST /workouts/:id/sets ───────────────────────────────────────────────

// `clientId` is the mobile-minted UUID per set tap. Unique per workout so
// retries from the offline sync queue collapse into a single insert.
export const LogSetSchema = z.object({
  clientId: z.string().uuid(),
  exerciseName: z.string().min(1).max(120),
  exerciseId: z.string().optional(),
  setNumber: z.number().int().min(1).max(50),
  reps: z.number().int().min(0).max(1000),
  weightKg: z.number().min(0).max(1000).optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),

  // Conditioning fields (WF-013). All nullable — strength sets leave them off.
  durationS: z.number().int().min(0).max(7200).optional(),
  roundNumber: z.number().int().min(1).max(100).optional(),
  intervalWorkS: z.number().int().min(0).max(3600).optional(),
  intervalRestS: z.number().int().min(0).max(3600).optional(),
});
export type LogSetBody = z.infer<typeof LogSetSchema>;

// ─── PATCH /workouts/:id (finish) ──────────────────────────────────────────

export const FinishWorkoutSchema = z.object({
  sessionRpe: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(2000).optional(),

  // Run fields (only when type=run)
  runDistanceM: z.number().int().min(0).optional(),
  runDurationS: z.number().int().min(0).optional(),
  runPaceSPerKm: z.number().int().min(0).optional(),
  runType: RunTypeEnum.optional(),
  runDistancePreset: RunDistancePresetEnum.optional(),
  runRoutePolyline: z.string().optional(),
  runSplitPaces: z.unknown().optional(),
});
export type FinishWorkoutBody = z.infer<typeof FinishWorkoutSchema>;
