import { createAdminClient } from "@/lib/supabase/admin";
import { weeklyWeightChange } from "@/lib/calculations/progress";
import { subDays } from "date-fns";
import type { Goal } from "@/types/database";

/**
 * Expected weekly rate of bodyweight change, as a % of bodyweight, per
 * goal. Ranges are intentionally conservative/sustainable rather than
 * aggressive. PERFORMANCE isn't weight-driven, so it's excluded — coaches
 * still set/adjust those targets manually.
 */
const EXPECTED_WEEKLY_PCT: Partial<Record<Goal, { min: number; max: number }>> = {
  FAT_LOSS: { min: -1.25, max: -0.25 },
  MUSCLE_GAIN: { min: 0.1, max: 0.6 },
  RECOMP: { min: -0.25, max: 0.25 },
  MAINTENANCE: { min: -0.25, max: 0.25 },
  GENERAL_HEALTH: { min: -0.25, max: 0.25 },
};

const MAX_ADJUSTMENT_KCAL = 200;
const MIN_CALORIES_FLOOR = 1200;
const MIN_DAYS_BETWEEN_ADJUSTMENTS = 7;

/**
 * Looks at a client's rolling weight trend plus recent hunger/energy
 * self-reports and, if warranted, generates a new active target
 * automatically. Applied immediately (per coach preference) — the coach
 * gets a notification with the reasoning rather than an approval gate.
 *
 * Intentionally conservative: caps any single adjustment at ±200 kcal,
 * only runs once per week per client, and does nothing when there isn't
 * enough data to be confident. This is a heuristic, not a clinical
 * algorithm — coaches can always override manually from the client profile,
 * which resets the once-per-week clock.
 */
export async function maybeAutoAdjustTargets(clientId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, coach_id, current_weight_kg, goal")
    .eq("id", clientId)
    .single();
  if (!client || !client.goal || !client.current_weight_kg) return;

  const expectedRange = EXPECTED_WEEKLY_PCT[client.goal];
  if (!expectedRange) return; // e.g. PERFORMANCE — not weight-driven

  const { data: activeTarget } = await supabase
    .from("targets")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .maybeSingle();
  if (!activeTarget || activeTarget.calories == null) return;

  // Respect a once-a-week cadence, whether the last change was automatic
  // or a manual coach edit — avoids reacting to daily noise and avoids
  // fighting a coach's very recent manual adjustment.
  const daysSinceLastChange =
    (Date.now() - new Date(activeTarget.effective_from).getTime()) / 86_400_000;
  if (daysSinceLastChange < MIN_DAYS_BETWEEN_ADJUSTMENTS) return;

  const since30 = subDays(new Date(), 30).toISOString();
  const { data: weights } = await supabase
    .from("weights")
    .select("weight_kg, recorded_at")
    .eq("client_id", clientId)
    .gte("recorded_at", since30)
    .order("recorded_at", { ascending: true });

  const weeklyChangeKg = weeklyWeightChange(
    (weights ?? []).map((w) => ({ weightKg: w.weight_kg, recordedAt: w.recorded_at }))
  );
  if (weeklyChangeKg == null) return; // not enough history yet to trust a trend

  const since7 = subDays(new Date(), 6).toISOString().slice(0, 10);
  const { data: recentLogs } = await supabase
    .from("daily_logs")
    .select("hunger_level, energy_level")
    .eq("client_id", clientId)
    .gte("log_date", since7);

  const hungerValues = (recentLogs ?? []).map((l) => l.hunger_level).filter((v): v is number => v != null);
  const energyValues = (recentLogs ?? []).map((l) => l.energy_level).filter((v): v is number => v != null);
  const hungerAvg = hungerValues.length ? hungerValues.reduce((a, b) => a + b, 0) / hungerValues.length : null;
  const energyAvg = energyValues.length ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length : null;

  const actualPct = (weeklyChangeKg / client.current_weight_kg) * 100;

  let deltaKcal = 0;
  let reason = "";

  const isLossGoal = client.goal === "FAT_LOSS";
  const isGainGoal = client.goal === "MUSCLE_GAIN";

  if (actualPct < expectedRange.min) {
    // Changing faster than the target range — for fat loss that's losing
    // too fast, for muscle gain that's losing/not gaining. Ease off to
    // protect adherence and (for fat loss) muscle mass.
    deltaKcal = isLossGoal ? 150 : isGainGoal ? 150 : -100;
    reason = `Weight trend (${actualPct.toFixed(2)}%/wk) is moving faster than the target range for ${client.goal.replace("_", " ").toLowerCase()} — easing calories to keep the rate sustainable.`;
  } else if (actualPct > expectedRange.max) {
    // Changing slower than expected (or in the wrong direction).
    deltaKcal = isLossGoal ? -150 : isGainGoal ? -100 : 100;
    reason = `Weight trend (${actualPct.toFixed(2)}%/wk) is behind the target range for ${client.goal.replace("_", " ").toLowerCase()} — adjusting calories to get progress moving.`;
  } else if (hungerAvg != null && hungerAvg >= 8) {
    // On track, but consistently very hungry — small increase to protect
    // long-term adherence even though the trend itself looks fine.
    deltaKcal = isLossGoal ? 75 : 50;
    reason = `On track, but reported hunger has averaged ${hungerAvg.toFixed(1)}/10 this week — a small increase to help with adherence.`;
  } else if (energyAvg != null && energyAvg <= 3) {
    deltaKcal = 75;
    reason = `On track, but reported energy has averaged ${energyAvg.toFixed(1)}/10 this week — a small increase to support training quality and recovery.`;
  }

  if (deltaKcal === 0) return;

  deltaKcal = Math.max(-MAX_ADJUSTMENT_KCAL, Math.min(MAX_ADJUSTMENT_KCAL, deltaKcal));
  const newCalories = Math.max(MIN_CALORIES_FLOOR, activeTarget.calories + deltaKcal);
  if (newCalories === activeTarget.calories) return;

  // Recompute macros around the new calorie target using the same split
  // philosophy as the initial onboarding targets (protein ~2g/kg, 25% fat,
  // remainder carbs) so the ratios stay coherent after repeated adjustments.
  const proteinG = Math.round(client.current_weight_kg * 2);
  const fatG = Math.round((newCalories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((newCalories - proteinG * 4 - fatG * 9) / 4));

  await supabase.from("targets").update({ is_active: false }).eq("client_id", clientId).eq("is_active", true);
  await supabase.from("targets").insert({
    client_id: clientId,
    calories: newCalories,
    protein_g: proteinG,
    carbs_g: carbsG,
    fat_g: fatG,
    water_ml: activeTarget.water_ml,
    is_active: true,
    is_auto_generated: true,
    adjustment_reason: reason,
  });

  if (client.coach_id) {
    const direction = newCalories > activeTarget.calories ? "increased" : "decreased";
    await supabase.from("notifications").insert({
      user_id: client.coach_id,
      client_id: clientId,
      type: "TARGET_AUTO_ADJUSTED",
      title: `${client.full_name}'s calories were ${direction} automatically`,
      body: `${activeTarget.calories} → ${newCalories} kcal. ${reason}`,
    });
  }
}
