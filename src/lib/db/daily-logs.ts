import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type DailyLogRow = Database["public"]["Tables"]["daily_logs"]["Row"];
export type MealRow = Database["public"]["Tables"]["meals"]["Row"];

export async function getLatestDailyLogsForClients(
  clientIds: string[]
): Promise<Record<string, DailyLogRow>> {
  if (clientIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .in("client_id", clientIds)
    .order("log_date", { ascending: false });

  if (error) throw error;
  const map: Record<string, DailyLogRow> = {};
  for (const row of data ?? []) {
    if (!map[row.client_id]) map[row.client_id] = row; // first (most recent) wins
  }
  return map;
}

export async function getRecentDailyLogsForClients(
  clientIds: string[],
  sinceDateIso: string
): Promise<Record<string, DailyLogRow[]>> {
  if (clientIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .in("client_id", clientIds)
    .gte("log_date", sinceDateIso)
    .order("log_date", { ascending: false });

  if (error) throw error;
  const map: Record<string, DailyLogRow[]> = {};
  for (const row of data ?? []) (map[row.client_id] ??= []).push(row);
  return map;
}

export async function getDailyLogsForClient(clientId: string, limit = 30): Promise<DailyLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("client_id", clientId)
    .order("log_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getDailyLogWithMeals(logId: string) {
  const supabase = await createClient();
  const { data: log, error } = await supabase.from("daily_logs").select("*").eq("id", logId).single();
  if (error) throw error;
  const { data: meals } = await supabase.from("meals").select("*").eq("daily_log_id", logId);
  return { log, meals: meals ?? [] };
}

export async function getOrCreateTodayLog(clientId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("client_id", clientId)
    .eq("log_date", today)
    .maybeSingle();
  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("daily_logs")
    .insert({ client_id: clientId, log_date: today, status: "PENDING" })
    .select("*")
    .single();
  if (error) throw error;
  return created;
}
