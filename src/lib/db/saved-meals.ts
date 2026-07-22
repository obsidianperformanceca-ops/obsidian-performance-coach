import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type SavedMealRow = Database["public"]["Tables"]["saved_meals"]["Row"];

export async function getSavedMealsForClient(clientId: string): Promise<SavedMealRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_meals")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
