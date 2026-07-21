import { createAdminClient } from "@/lib/supabase/admin";
import { getClientsForCoach } from "@/lib/db/clients";
import { getLatestDailyLogsForClients } from "@/lib/db/daily-logs";
import { daysSince } from "@/lib/calculations/progress";

/**
 * Scans a coach's active clients for overdue check-ins / workouts and
 * inserts CLIENT-facing reminder notifications (deduped per day).
 *
 * This runs on-demand (triggered from the coach dashboard load). For a
 * production deployment, wire this up to a scheduled job — e.g. a Supabase
 * Edge Function on a cron trigger, or a Vercel Cron hitting
 * POST /api/notifications/generate once daily.
 */
export async function generateReminderNotifications(coachId: string) {
  const supabase = createAdminClient();
  const clients = await getClientsForCoach(coachId);
  const activeClients = clients.filter((c) => c.status === "ACTIVE" && c.user_id);
  const latestLogs = await getLatestDailyLogsForClients(activeClients.map((c) => c.id));

  const todayKey = new Date().toISOString().slice(0, 10);

  for (const client of activeClients) {
    if (!client.user_id) continue;
    const last = latestLogs[client.id]?.log_date ?? null;
    const days = daysSince(last);

    let type: "MISSED_CHECKIN" | "WEEKLY_CHECKIN_DUE" | null = null;
    let title = "";
    if (days === null || days >= 2) {
      type = "MISSED_CHECKIN";
      title = "You haven't checked in recently — log today's progress.";
    } else if (days >= 6) {
      type = "WEEKLY_CHECKIN_DUE";
      title = "Your weekly check-in is due.";
    }
    if (!type) continue;

    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", client.user_id)
      .eq("type", type)
      .gte("created_at", `${todayKey}T00:00:00.000Z`)
      .maybeSingle();

    if (!existing) {
      await supabase.from("notifications").insert({
        user_id: client.user_id,
        client_id: client.id,
        type,
        title,
      });
    }
  }
}
