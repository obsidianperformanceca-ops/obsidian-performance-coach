import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export async function getClientsForCoach(coachId: string): Promise<ClientRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("coach_id", coachId)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getClientById(clientId: string): Promise<ClientRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").eq("id", clientId).single();
  return data ?? null;
}
