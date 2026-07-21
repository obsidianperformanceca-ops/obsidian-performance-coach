/**
 * Placeholder calorie/macro estimation. Coaches enter estimates manually
 * today (see Coach Food Review). Swap this out for an AI call later —
 * the DailyLog/Meal schema already has est_calories/protein/carbs/fat
 * columns ready to be filled programmatically.
 */
export function estimateFromDescription(
  description: string // eslint-disable-line @typescript-eslint/no-unused-vars
): {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
} {
  return { calories: null, proteinG: null, carbsG: null, fatG: null };
}
