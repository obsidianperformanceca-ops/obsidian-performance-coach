import type { UnitPreference } from "@/types/database";

const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

// --- Canonical storage is always kg / cm. These helpers convert only at
// the display/input boundary based on a client's unit_preference. ---

export function kgToLbs(kg: number): number {
  return kg / KG_PER_LB;
}
export function lbsToKg(lbs: number): number {
  return lbs * KG_PER_LB;
}

export function cmToInches(cm: number): number {
  return cm / CM_PER_INCH;
}
export function inchesToCm(inches: number): number {
  return inches * CM_PER_INCH;
}

export interface FeetInches {
  feet: number;
  inches: number;
}

export function cmToFeetInches(cm: number): FeetInches {
  const totalInches = cmToInches(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  // Handle rounding pushing inches to 12
  if (inches === 12) return { feet: feet + 1, inches: 0 };
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return inchesToCm(feet * 12 + inches);
}

/** Round to 1 decimal place — used for weight display. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Display a stored kg value in the client's preferred unit, as a plain
 * number (already rounded), for use in number inputs.
 */
export function displayWeight(weightKg: number | null, unit: UnitPreference): number | null {
  if (weightKg == null) return null;
  return unit === "IMPERIAL" ? round1(kgToLbs(weightKg)) : round1(weightKg);
}

/** Convert a value typed into a weight input (in the client's preferred unit) back to kg for storage. */
export function weightToKg(value: number, unit: UnitPreference): number {
  return unit === "IMPERIAL" ? lbsToKg(value) : value;
}

/** Formatted weight string with unit suffix, e.g. "182.4 lb" or "82.7 kg". */
export function formatWeight(weightKg: number | null, unit: UnitPreference): string {
  const v = displayWeight(weightKg, unit);
  if (v == null) return "—";
  return `${v} ${unit === "IMPERIAL" ? "lb" : "kg"}`;
}

/** Formatted height string, e.g. 5'11" or 180 cm. */
export function formatHeight(heightCm: number | null, unit: UnitPreference): string {
  if (heightCm == null) return "—";
  if (unit === "IMPERIAL") {
    const { feet, inches } = cmToFeetInches(heightCm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(heightCm)} cm`;
}

/** Convert feet+inches typed into a height input back to cm for storage. */
export function heightToCm(feet: number, inches: number, unit: UnitPreference): number {
  if (unit === "IMPERIAL") return Math.round(feetInchesToCm(feet, inches) * 10) / 10;
  // In metric mode, `feet` is used as the raw cm value and `inches` is ignored.
  return feet;
}
