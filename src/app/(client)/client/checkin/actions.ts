"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/session";
import { maybeAutoAdjustTargets } from "@/lib/calculations/auto-adjust";

export async function submitCheckInAction(payload: {
  logId: string;
  morningWeightKg?: number;
  energyLevel?: number;
  hungerLevel?: number;
  digestion?: string;
  clientNotes?: string;
}) {
  const { client } = await requireClient();
  const supabase = await createClient();

  const { error } = await supabase
    .from("daily_logs")
    .update({
      morning_weight_kg: payload.morningWeightKg,
      energy_level: payload.energyLevel,
      hunger_level: payload.hungerLevel,
      digestion: payload.digestion,
      client_notes: payload.clientNotes,
      status: "SUBMITTED",
    })
    .eq("id", payload.logId);

  if (error) throw error;

  if (payload.morningWeightKg) {
    await supabase.from("weights").insert({ client_id: client.id, weight_kg: payload.morningWeightKg });
    await supabase.from("clients").update({ current_weight_kg: payload.morningWeightKg }).eq("id", client.id);

    // A fresh weight entry is the trigger point for the auto-adjustment
    // system — it looks at the rolling weight trend plus recent hunger/
    // energy averages and updates the active target if warranted.
    await maybeAutoAdjustTargets(client.id).catch((err) => {
      console.error("Auto-adjust targets failed:", err);
    });
  }

  revalidatePath("/client/checkin");
  revalidatePath("/client/dashboard");
  revalidatePath("/client/progress");
}
