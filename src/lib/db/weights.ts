import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type WeightRow = Database["public"]["Tables"]["weights"]["Row"];

export async function getWeightsForClients(
  clientIds: string[],
  sinceIso: string
): Promise<Record<string, WeightRow[]>> {
  if (clientIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weights")
    .select("*")
    .in("client_id", clientIds)
    .gte("recorded_at", sinceIso)
    .order("recorded_at", { ascending: true });

  if (error) throw error;
  const map: Record<string, WeightRow[]> = {};
  for (const row of data ?? []) {
    (map[row.client_id] ??= []).push(row);
  }
  return map;
}

export async function getWeightsForClient(clientId: string, sinceIso?: string): Promise<WeightRow[]> {
  const supabase = await createClient();
  let query = supabase.from("weights").select("*").eq("client_id", clientId);
  if (sinceIso) query = query.gte("recorded_at", sinceIso);
  const { data, error } = await query.order("recorded_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addWeight(clientId: string, weightKg: number, recordedAt?: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("weights")
    .insert({ client_id: clientId, weight_kg: weightKg, recorded_at: recordedAt ?? new Date().toISOString() });
  if (error) throw error;
}
