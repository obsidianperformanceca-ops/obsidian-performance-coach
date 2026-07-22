import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type SupplementProtocolRow = Database["public"]["Tables"]["supplement_protocols"]["Row"];

export async function getSupplementsForClient(clientId: string): Promise<SupplementProtocolRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplement_protocols")
    .select("*")
    .eq("client_id", clientId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
