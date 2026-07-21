import type { Goal, ActivityLevel } from "@/types/database";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTREMELY_ACTIVE: 1.9,
};

const GOAL_ADJUSTMENT: Record<Goal, number> = {
  FAT_LOSS: -0.2,
  MUSCLE_GAIN: 0.1,
  RECOMP: -0.05,
  MAINTENANCE: 0,
  PERFORMANCE: 0.05,
  GENERAL_HEALTH: 0,
};

/**
 * Starting-point nutrition targets, generated right after onboarding so the
 * client profile isn't empty. Uses Mifflin-St Jeor for BMR. The coach can
 * (and should) fine-tune these — this is a sensible default, not gospel.
 */
export function generateStartingTargets({
  weightKg,
  heightCm,
  age,
  sex = "male",
  activityLevel,
  goal,
}: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex?: "male" | "female";
  activityLevel: ActivityLevel;
  goal: Goal;
}) {
  const bmr =
    sex === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIER[activityLevel];
  const calories = Math.round(tdee * (1 + GOAL_ADJUSTMENT[goal]));

  const proteinG = Math.round(weightKg * 2); // ~2g/kg bodyweight
  const fatCalories = calories * 0.25;
  const fatG = Math.round(fatCalories / 9);
  const proteinCalories = proteinG * 4;
  const carbsG = Math.max(0, Math.round((calories - proteinCalories - fatCalories) / 4));
  const waterMl = Math.round(weightKg * 35);

  return { calories, proteinG, carbsG, fatG, waterMl };
}
