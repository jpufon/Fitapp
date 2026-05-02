// Unit conversion + display helpers.
// Storage rule: DB always stores kg + ml. UI calls displayX() to render in user's
// preferred system; mutation paths call storageX() to convert input back to canonical.

export type UnitSystem = 'metric' | 'imperial';

const KG_PER_LB = 0.45359237;
const ML_PER_FL_OZ = 29.5735;
const ML_PER_GLASS = 250;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

// ── Weight ─────────────────────────────────────────────────────────────────

export type DisplayWeight = { value: number; unit: 'kg' | 'lb' };

// Convert canonical kg to user-facing value. Rounds to half-unit (0.5 kg / 1 lb)
// because lifters round to plate increments anyway.
export function displayWeight(kg: number, system: UnitSystem): DisplayWeight {
  if (system === 'imperial') {
    return { value: Math.round(kgToLb(kg)), unit: 'lb' };
  }
  return { value: Math.round(kg * 2) / 2, unit: 'kg' };
}

// Format directly to a string. Useful in lists where you want the unit inline.
export function formatWeight(kg: number, system: UnitSystem): string {
  const { value, unit } = displayWeight(kg, system);
  return `${value} ${unit}`;
}

// Convert user input back to canonical kg for DB storage.
export function storageWeight(value: number, system: UnitSystem): number {
  if (system === 'imperial') return lbToKg(value);
  return value;
}

// ── Water ──────────────────────────────────────────────────────────────────
// Stored in ml. Glasses = 250ml (V1 default — editable in Settings later).

export type WaterDisplayUnit = 'ml' | 'fl_oz' | 'glasses';

export function displayWater(
  ml: number,
  unit: WaterDisplayUnit = 'ml',
): { value: number; unit: WaterDisplayUnit } {
  switch (unit) {
    case 'fl_oz':
      return { value: Math.round(ml / ML_PER_FL_OZ), unit };
    case 'glasses':
      return { value: Math.round((ml / ML_PER_GLASS) * 10) / 10, unit };
    case 'ml':
    default:
      return { value: Math.round(ml), unit };
  }
}

export function storageWater(value: number, unit: WaterDisplayUnit): number {
  switch (unit) {
    case 'fl_oz':
      return Math.round(value * ML_PER_FL_OZ);
    case 'glasses':
      return Math.round(value * ML_PER_GLASS);
    case 'ml':
    default:
      return Math.round(value);
  }
}

// ── Distance (run UX) ──────────────────────────────────────────────────────
// Stored in metres. Mobile run views show metric AND imperial pace simultaneously
// per WF-033, so we expose both directions here.

const METRES_PER_MILE = 1609.344;

export function displayDistance(
  metres: number,
  system: UnitSystem,
): { value: number; unit: 'km' | 'mi' } {
  if (system === 'imperial') {
    return { value: Math.round((metres / METRES_PER_MILE) * 100) / 100, unit: 'mi' };
  }
  return { value: Math.round((metres / 1000) * 100) / 100, unit: 'km' };
}

// Pace stored as seconds per km. Convert to seconds per mile when needed.
export function paceSPerMile(secPerKm: number): number {
  return Math.round(secPerKm * (METRES_PER_MILE / 1000));
}
