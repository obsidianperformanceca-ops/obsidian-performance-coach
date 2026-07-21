import { z } from "zod";

export const goalEnum = z.enum([
  "FAT_LOSS",
  "MUSCLE_GAIN",
  "RECOMP",
  "MAINTENANCE",
  "PERFORMANCE",
  "GENERAL_HEALTH",
]);

export const activityLevelEnum = z.enum([
  "SEDENTARY",
  "LIGHTLY_ACTIVE",
  "MODERATELY_ACTIVE",
  "VERY_ACTIVE",
  "EXTREMELY_ACTIVE",
]);

export const experienceLevelEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const trainingLocationEnum = z.enum(["GYM", "HOME", "HYBRID"]);
export const unitPreferenceEnum = z.enum(["METRIC", "IMPERIAL"]);

export const newClientSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
});

export const onboardingSchema = z.object({
  // Basic info
  fullName: z.string().min(1),
  age: z.coerce.number().int().positive().optional(),
  heightCm: z.coerce.number().positive().optional(),
  currentWeightKg: z.coerce.number().positive().optional(),
  goalWeightKg: z.coerce.number().positive().optional(),
  goal: goalEnum.optional(),
  activityLevel: activityLevelEnum.optional(),
  unitPreference: unitPreferenceEnum.optional(),

  // Training
  daysPerWeek: z.coerce.number().int().min(0).max(14).optional(),
  workoutDurationMin: z.coerce.number().int().positive().optional(),
  gymOrHome: trainingLocationEnum.optional(),
  experience: experienceLevelEnum.optional(),
  injuries: z.string().optional(),

  // Nutrition
  typicalEatingHabits: z.string().optional(),
  foodsEnjoyed: z.string().optional(),
  allergies: z.string().optional(),
  mealsPerDay: z.coerce.number().int().positive().optional(),
  alcohol: z.string().optional(),

  // Lifestyle
  job: z.string().optional(),
  dailySteps: z.coerce.number().int().nonnegative().optional(),
  sleepHours: z.coerce.number().positive().optional(),
  motivation: z.string().optional(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const dailyLogSchema = z.object({
  logDate: z.string(),
  morningWeightKg: z.coerce.number().positive().optional(),
  waterMl: z.coerce.number().int().nonnegative().optional(),
  workoutCompleted: z.boolean().optional(),
  workoutName: z.string().optional(),
  steps: z.coerce.number().int().nonnegative().optional(),
  sleepHours: z.coerce.number().nonnegative().optional(),
  energyLevel: z.coerce.number().int().min(1).max(10).optional(),
  hungerLevel: z.coerce.number().int().min(1).max(10).optional(),
  digestion: z.string().optional(),
  clientNotes: z.string().optional(),
  meals: z
    .array(
      z.object({
        type: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "DRINK"]),
        description: z.string().min(1),
      })
    )
    .default([]),
});
export type DailyLogInput = z.infer<typeof dailyLogSchema>;

export const foodReviewSchema = z.object({
  estCalories: z.coerce.number().int().nonnegative().optional(),
  estProteinG: z.coerce.number().int().nonnegative().optional(),
  estCarbsG: z.coerce.number().int().nonnegative().optional(),
  estFatG: z.coerce.number().int().nonnegative().optional(),
  coachFeedback: z.string().optional(),
  approve: z.boolean().optional(),
});

export const targetSchema = z.object({
  calories: z.coerce.number().int().nonnegative().optional(),
  proteinG: z.coerce.number().int().nonnegative().optional(),
  carbsG: z.coerce.number().int().nonnegative().optional(),
  fatG: z.coerce.number().int().nonnegative().optional(),
  waterMl: z.coerce.number().int().nonnegative().optional(),
});

export const coachNoteSchema = z.object({
  body: z.string().min(1, "Note can't be empty"),
});

export const messageSchema = z.object({
  body: z.string().min(1, "Message can't be empty"),
});

// Public lead-capture form on the marketing homepage — not an account
// signup. See src/app/api/leads/route.ts for why this is separate from
// the client onboarding invite flow.
export const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  goals: z.string().min(1, "Please share your goals"),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const workoutProgramSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional(),
  days: z.array(
    z.object({
      name: z.string().min(1),
      exercises: z.array(
        z.object({
          name: z.string().min(1),
          sets: z.coerce.number().int().positive(),
          reps: z.string().min(1),
          rpe: z.coerce.number().positive().optional(),
          notes: z.string().optional(),
        })
      ),
    })
  ),
});
