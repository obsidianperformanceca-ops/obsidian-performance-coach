"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/session";

interface MealInput {
  type: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "DRINK";
  description: string;
}

export async function submitCheckInAction(payload: {
  logId: string;
  morningWeightKg?: number;
  waterMl?: number;
  workoutCompleted?: boolean;
  workoutName?: string;
  steps?: number;
  sleepHours?: number;
  energyLevel?: number;
  hungerLevel?: number;
  digestion?: string;
  clientNotes?: string;
  meals: MealInput[];
}) {
  const { client } = await requireClient();
  const supabase = await createClient();

  const { error } = await supabase
    .from("daily_logs")
    .update({
      morning_weight_kg: payload.morningWeightKg,
      water_ml: payload.waterMl,
      workout_completed: payload.workoutCompleted,
      workout_name: payload.workoutName,
      steps: payload.steps,
      sleep_hours: payload.sleepHours,
      energy_level: payload.energyLevel,
      hunger_level: payload.hungerLevel,
      digestion: payload.digestion,
      client_notes: payload.clientNotes,
      status: "SUBMITTED",
    })
    .eq("id", payload.logId);

  if (error) throw error;

  await supabase.from("meals").delete().eq("daily_log_id", payload.logId);
  const mealsToInsert = payload.meals.filter((m) => m.description.trim().length > 0);
  if (mealsToInsert.length > 0) {
    await supabase
      .from("meals")
      .insert(mealsToInsert.map((m) => ({ daily_log_id: payload.logId, type: m.type, description: m.description })));
  }

  if (payload.morningWeightKg) {
    await supabase.from("weights").insert({ client_id: client.id, weight_kg: payload.morningWeightKg });
    await supabase.from("clients").update({ current_weight_kg: payload.morningWeightKg }).eq("id", client.id);
  }

  revalidatePath("/client/checkin");
  revalidatePath("/client/dashboard");
  revalidatePath("/client/progress");
}
