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

/**
 * Per-day calorie/protein totals summed from meal-level estimates, for the
 * daily-intake history chart. Days with a log but no estimated meals show
 * as 0 — only days with at least one meal row are included at all.
 */
export async function getDailyMealTotals(
  clientId: string,
  days = 30
): Promise<{ date: string; calories: number; proteinG: number }[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

  const { data: logs, error } = await supabase
    .from("daily_logs")
    .select("id, log_date")
    .eq("client_id", clientId)
    .gte("log_date", since)
    .order("log_date", { ascending: true });
  if (error) throw error;
  if (!logs || logs.length === 0) return [];

  const { data: meals } = await supabase
    .from("meals")
    .select("daily_log_id, est_calories, est_protein_g")
    .in(
      "daily_log_id",
      logs.map((l) => l.id)
    );

  const byLog: Record<string, { calories: number; proteinG: number }> = {};
  for (const m of meals ?? []) {
    const acc = (byLog[m.daily_log_id] ??= { calories: 0, proteinG: 0 });
    acc.calories += m.est_calories ?? 0;
    acc.proteinG += m.est_protein_g ?? 0;
  }

  return logs
    .filter((l) => byLog[l.id])
    .map((l) => ({ date: l.log_date, ...byLog[l.id] }));
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
