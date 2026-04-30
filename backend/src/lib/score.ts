// DailyScore computation — single source of truth for the Vitality Tree.
// Formula per V1 features doc §F3:
//   totalScore = (steps/stepsGoal * 0.40) + (proteinG/proteinTargetG * 0.30) + (waterMl/waterTargetMl * 0.30)
// Each pillar capped at 1.0. Rest day → steps pillar = 0.5 (neutral).

import type { TreeState } from '@prisma/client';

export const PILLAR_WEIGHTS = {
  steps: 0.40,
  protein: 0.30,
  water: 0.30,
} as const;

export type ScoreInput = {
  stepsCount: number;
  stepsGoal: number;
  proteinG: number;
  proteinTargetG: number;
  waterMl: number;
  waterTargetMl: number;
  isRestDay: boolean;
};

export type ScoreOutput = {
  stepsScore: number;
  proteinScore: number;
  waterScore: number;
  totalScore: number;
  treeState: TreeState;
};

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.min(1, Math.max(0, numerator / denominator));
}

export function computeScore(input: ScoreInput): ScoreOutput {
  const stepsScore = input.isRestDay ? 0.5 : pct(input.stepsCount, input.stepsGoal);
  const proteinScore = pct(input.proteinG, input.proteinTargetG);
  const waterScore = pct(input.waterMl, input.waterTargetMl);

  const totalScore =
    stepsScore * PILLAR_WEIGHTS.steps +
    proteinScore * PILLAR_WEIGHTS.protein +
    waterScore * PILLAR_WEIGHTS.water;

  return {
    stepsScore,
    proteinScore,
    waterScore,
    totalScore,
    treeState: stateFromScore(totalScore),
  };
}

// 6 states · ranges per V1 features doc §F3.
// Wilted 0–15 · Recovering 16–35 · Sprout 36–55 · Growing 56–75 · Thriving 76–90 · Full Vitality 91–100
export function stateFromScore(totalScore: number): TreeState {
  const pct100 = totalScore * 100;
  if (pct100 <= 15) return 'wilted';
  if (pct100 <= 35) return 'recovering';
  if (pct100 <= 55) return 'sprout';
  if (pct100 <= 75) return 'growing';
  if (pct100 <= 90) return 'thriving';
  return 'full_vitality';
}
