export type MacroEstimate = {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

/**
 * AI-estimates calories/macros for a logged meal from its free-text
 * description + serving size. Used by /api/meals/estimate to pre-fill the
 * client's meal-log form — the client can always edit or fully hand-enter
 * the numbers instead, so this is best-effort, not authoritative.
 *
 * Optional by design: without ANTHROPIC_API_KEY configured, this quietly
 * returns nulls and the UI falls back to manual entry rather than erroring.
 */
export async function estimateFromDescription(
  description: string,
  servingSize?: string | null
): Promise<MacroEstimate> {
  const empty: MacroEstimate = { calories: null, proteinG: null, carbsG: null, fatG: null };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !description.trim()) return empty;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content:
              `Estimate the nutrition for this food using typical/average nutrition data. ` +
              `Respond with ONLY a JSON object and nothing else — no markdown, no explanation: ` +
              `{"calories": number, "proteinG": number, "carbsG": number, "fatG": number}. Round to whole numbers.\n\n` +
              `Food: ${description.trim()}\n` +
              `Serving size: ${servingSize?.trim() || "not specified — assume one typical serving"}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return empty;

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return empty;

    const parsed = JSON.parse(match[0]);
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null);

    return {
      calories: num(parsed.calories),
      proteinG: num(parsed.proteinG),
      carbsG: num(parsed.carbsG),
      fatG: num(parsed.fatG),
    };
  } catch {
    // Network error, timeout, bad JSON, etc. — fail quietly to manual entry.
    return empty;
  }
}

type MealMacros = {
  est_calories: number | null;
  est_protein_g: number | null;
  est_carbs_g: number | null;
  est_fat_g: number | null;
};

/**
 * Sums a set of logged meals into daily totals — the basis for the
 * MyFitnessPal-style "remaining calories/macros" display on the client
 * dashboard and the coach's food review page. Meals with no estimate yet
 * (still-null fields) simply contribute 0, so a mix of estimated and
 * not-yet-estimated meals still gives a (partial) running total.
 */
export function sumMealTotals(meals: MealMacros[]): {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
} {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.est_calories ?? 0),
      proteinG: acc.proteinG + (m.est_protein_g ?? 0),
      carbsG: acc.carbsG + (m.est_carbs_g ?? 0),
      fatG: acc.fatG + (m.est_fat_g ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}
