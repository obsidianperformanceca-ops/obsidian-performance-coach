/**
 * Open Food Facts mapping — shared by the food-search and barcode-lookup
 * API routes. OFF is a free, open database (no API key); nutrition comes
 * back per-100g always, and per-serving when the product declares one.
 */

export type FoodSearchResult = {
  name: string;
  brand: string | null;
  servingSize: string | null;
  // Nutrition basis: per declared serving when available, else per 100g.
  basis: "serving" | "100g";
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

type OffNutriments = Record<string, number | string | undefined>;

export type OffProduct = {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OffNutriments;
};

function num(v: number | string | undefined): number | null {
  if (v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

export function mapOffProduct(p: OffProduct): FoodSearchResult | null {
  const name = p.product_name?.trim();
  if (!name || !p.nutriments) return null;
  const n = p.nutriments;

  const hasServing = Boolean(p.serving_size && n["energy-kcal_serving"] !== undefined);
  const suffix = hasServing ? "_serving" : "_100g";

  const calories = num(n[`energy-kcal${suffix}`]);
  if (calories === null) return null;

  return {
    name,
    brand: p.brands?.split(",")[0]?.trim() || null,
    servingSize: hasServing ? p.serving_size!.trim() : "100 g",
    basis: hasServing ? "serving" : "100g",
    calories: Math.round(calories),
    proteinG: num(n[`proteins${suffix}`]),
    carbsG: num(n[`carbohydrates${suffix}`]),
    fatG: num(n[`fat${suffix}`]),
  };
}

export const OFF_USER_AGENT = "ObsidianPerformanceCoach/1.0 (nutrition logging)";
