import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type FastRow = Database["public"]["Tables"]["fasts"]["Row"];

/** The in-progress fast (ended_at null), if any, plus the most recent completed one. */
export async function getFastingState(clientId: string): Promise<{
  activeFast: FastRow | null;
  lastFast: FastRow | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fasts")
    .select("*")
    .eq("client_id", clientId)
    .order("started_at", { ascending: false })
    .limit(5);
  if (error) throw error;

  const rows = data ?? [];
  return {
    activeFast: rows.find((f) => f.ended_at === null) ?? null,
    lastFast: rows.find((f) => f.ended_at !== null) ?? null,
  };
}
