"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth/session";

export async function submitFoodReviewAction(
  clientId: string,
  logId: string,
  formData: FormData
) {
  await requireCoach();
  const supabase = await createClient();

  const approve = formData.get("approve") === "on";

  const { error } = await supabase
    .from("daily_logs")
    .update({
      est_calories: num(formData.get("estCalories")),
      est_protein_g: num(formData.get("estProteinG")),
      est_carbs_g: num(formData.get("estCarbsG")),
      est_fat_g: num(formData.get("estFatG")),
      coach_feedback: str(formData.get("coachFeedback")) || null,
      status: approve ? "APPROVED" : "REVIEWED",
      reviewed_at: new Date().toISOString(),
      approved_at: approve ? new Date().toISOString() : null,
    })
    .eq("id", logId);

  if (error) throw error;

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath(`/coach/clients/${clientId}/logs/${logId}`);
  redirect(`/coach/clients/${clientId}`);
}

function num(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}
