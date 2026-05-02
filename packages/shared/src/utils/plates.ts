// Plate math — given a target weight + barbell, return the plates to load
// per side. Pure function. Used by ActiveWorkoutScreen plate guide.

import type { UnitSystem } from './units';
import { kgToLb, lbToKg } from './units';

// Canonical plate inventories. Anything outside the inventory falls back to
// "closest possible" with the leftover surfaced in the result.
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];
const PLATES_LB = [45, 35, 25, 10, 5, 2.5, 1.25];

const DEFAULT_BAR_KG = 20;
const DEFAULT_BAR_LB = 45;

export type PlateBreakdown = {
  // Plates loaded per side, largest first. e.g. [20, 5] = 20kg + 5kg per side.
  perSide: number[];
  // Sum of all plates loaded (both sides combined).
  totalPlateWeight: number;
  // Bar weight used.
  barWeight: number;
  // Unit echoed back so the UI doesn't re-derive from the system flag.
  unit: 'kg' | 'lb';
  // Difference between target and what we could actually load. Positive = under target.
  remainder: number;
};

export type CalculatePlatesOptions = {
  system: UnitSystem;
  // Override the bar weight in the user's system (kg if metric, lb if imperial).
  barWeight?: number;
  // Override the plate inventory. Useful for home gyms with limited plates.
  plates?: number[];
};

// targetWeight + barWeight + plates are all in the user's display system.
// Conversion to kg happens at the storage layer, not here.
export function calculatePlates(
  targetWeight: number,
  options: CalculatePlatesOptions,
): PlateBreakdown {
  const isImperial = options.system === 'imperial';
  const unit: 'kg' | 'lb' = isImperial ? 'lb' : 'kg';
  const barWeight = options.barWeight ?? (isImperial ? DEFAULT_BAR_LB : DEFAULT_BAR_KG);
  const inventory = (options.plates ?? (isImperial ? PLATES_LB : PLATES_KG))
    .slice()
    .sort((a, b) => b - a);

  if (targetWeight <= barWeight) {
    return {
      perSide: [],
      totalPlateWeight: 0,
      barWeight,
      unit,
      remainder: targetWeight - barWeight,
    };
  }

  let perSideRemaining = (targetWeight - barWeight) / 2;
  const perSide: number[] = [];

  for (const plate of inventory) {
    while (perSideRemaining >= plate - 1e-6) {
      perSide.push(plate);
      perSideRemaining -= plate;
    }
  }

  const loadedPerSide = perSide.reduce((sum, p) => sum + p, 0);
  return {
    perSide,
    totalPlateWeight: loadedPerSide * 2,
    barWeight,
    unit,
    remainder: Math.round(perSideRemaining * 2 * 100) / 100,
  };
}

// Convenience for the rare cross-system query (e.g. "show me what 100kg looks
// like in my imperial bar").
export function calculatePlatesFromKg(
  targetKg: number,
  options: CalculatePlatesOptions,
): PlateBreakdown {
  const target = options.system === 'imperial' ? kgToLb(targetKg) : targetKg;
  return calculatePlates(target, options);
}

export function calculatePlatesFromLb(
  targetLb: number,
  options: CalculatePlatesOptions,
): PlateBreakdown {
  const target = options.system === 'metric' ? lbToKg(targetLb) : targetLb;
  return calculatePlates(target, options);
}
