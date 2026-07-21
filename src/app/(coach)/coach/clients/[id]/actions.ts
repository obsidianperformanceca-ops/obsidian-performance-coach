"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth/session";
import { setActiveTarget } from "@/lib/db/targets";
import { addMeasurement } from "@/lib/db/measurements";
import { addNote } from "@/lib/db/notes";
import { addWeight } from "@/lib/db/weights";
import type { Goal, ActivityLevel, ExperienceLevel, TrainingLocation, ClientStatus } from "@/types/database";

export async function updateTargetsAction(clientId: string, formData: FormData) {
  await requireCoach();
  await setActiveTarget(clientId, {
    calories: num(formData.get("calories")),
    proteinG: num(formData.get("proteinG")),
    carbsG: num(formData.get("carbsG")),
    fatG: num(formData.get("fatG")),
    waterMl: num(formData.get("waterMl")),
  });
  revalidatePath(`/coach/clients/${clientId}`);
}

export async function updateLifestyleGoalsAction(clientId: string, formData: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase
    .from("clients")
    .update({
      sleep_goal_hours: num(formData.get("sleepGoalHours")),
      step_goal: num(formData.get("stepGoal")),
      cardio_goal_min: num(formData.get("cardioGoalMin")),
    })
    .eq("id", clientId);
  revalidatePath(`/coach/clients/${clientId}`);
}

export async function updateBasicInfoAction(clientId: string, formData: FormData) {
  await requireCoach();
  const supabase = await createClient();
  await supabase
    .from("clients")
    .update({
      full_name: str(formData.get("fullName")),
      age: num(formData.get("age")),
      height_cm: num(formData.get("heightCm")),
      current_weight_kg: num(formData.get("currentWeightKg")),
      goal_weight_kg: num(formData.get("goalWeightKg")),
      goal: (str(formData.get("goal")) || null) as Goal | null,
      activity_level: (str(formData.get("activityLevel")) || null) as ActivityLevel | null,
      occupation: str(formData.get("occupation")),
      injuries: str(formData.get("injuries")),
      experience_level: (str(formData.get("experienceLevel")) || null) as ExperienceLevel | null,
      equipment_available: str(formData.get("equipmentAvailable")),
      training_location: (str(formData.get("trainingLocation")) || null) as TrainingLocation | null,
      status: (str(formData.get("status")) || undefined) as ClientStatus | undefined,
    })
    .eq("id", clientId);
  revalidatePath(`/coach/clients/${clientId}`);
}

export async function addNoteAction(clientId: string, formData: FormData) {
  const coach = await requireCoach();
  const body = str(formData.get("body"));
  if (!body) return;
  await addNote(clientId, coach.id, body);
  revalidatePath(`/coach/clients/${clientId}`);
}

export async function addMeasurementAction(clientId: string, formData: FormData) {
  await requireCoach();
  await addMeasurement(clientId, {
    waistCm: num(formData.get("waistCm")) ?? undefined,
    chestCm: num(formData.get("chestCm")) ?? undefined,
    hipsCm: num(formData.get("hipsCm")) ?? undefined,
    armCm: num(formData.get("armCm")) ?? undefined,
    thighCm: num(formData.get("thighCm")) ?? undefined,
  });
  revalidatePath(`/coach/clients/${clientId}`);
}

export async function addWeightAction(clientId: string, formData: FormData) {
  await requireCoach();
  const weight = num(formData.get("weightKg"));
  if (weight == null) return;
  await addWeight(clientId, weight);

  const supabase = await createClient();
  await supabase.from("clients").update({ current_weight_kg: weight }).eq("id", clientId);
  revalidatePath(`/coach/clients/${clientId}`);
}

function num(v: FormDataEntryValue | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}
