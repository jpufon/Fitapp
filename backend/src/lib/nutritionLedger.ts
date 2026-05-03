// WF-017 / WF-018 — additive nutrition ledger.
// Every protein/water tap appends a NutritionEntry keyed by (userId, clientId).
// SimpleNutritionLog is kept in lockstep as the materialized SUM via an
// atomic ON CONFLICT … DO UPDATE — no race between concurrent taps.
// Steps stays absolute: the pedometer reports cumulative counts, so we pass
// it straight through to upsertDailyScore.

import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { upsertDailyScore } from './dailyScore.js';

export type NutritionDelta = {
  proteinDeltaG?: number;
  waterDeltaMl?: number;
  stepsCount?: number;
};

export type ApplyDeltaResult = {
  dailyScore: Awaited<ReturnType<typeof upsertDailyScore>>;
  isReplay: boolean;
};

export async function applyNutritionDelta(
  userId: string,
  date: Date,
  delta: NutritionDelta,
  clientId: string,
): Promise<ApplyDeltaResult> {
  const proteinDeltaG = delta.proteinDeltaG ?? 0;
  const waterDeltaMl = delta.waterDeltaMl ?? 0;
  const hasNutritionDelta = proteinDeltaG !== 0 || waterDeltaMl !== 0;

  return prisma.$transaction(async (tx) => {
    let isReplay = false;

    if (hasNutritionDelta) {
      try {
        await tx.nutritionEntry.create({
          data: { userId, date, clientId, proteinDeltaG, waterDeltaMl },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          // Same clientId already applied — sync queue retry. No-op.
          isReplay = true;
        } else {
          throw err;
        }
      }

      if (!isReplay) {
        // Atomic SUM materialization. Clamp at 0 so a delete/undo never
        // produces a negative total.
        await tx.$executeRaw`
          INSERT INTO "simple_nutrition_logs" ("id", "userId", "date", "proteinG", "waterMl", "updatedAt")
          VALUES (gen_random_uuid(), ${userId}::uuid, ${date}::date, GREATEST(0, ${proteinDeltaG}), GREATEST(0, ${waterDeltaMl}), NOW())
          ON CONFLICT ("userId", "date")
          DO UPDATE SET
            "proteinG" = GREATEST(0, "simple_nutrition_logs"."proteinG" + ${proteinDeltaG}),
            "waterMl" = GREATEST(0, "simple_nutrition_logs"."waterMl" + ${waterDeltaMl}),
            "updatedAt" = NOW()
        `;
      }
    }

    const dailyScore = await upsertDailyScore(
      userId,
      date,
      { stepsCount: delta.stepsCount },
      tx,
    );

    return { dailyScore, isReplay };
  });
}
