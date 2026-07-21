import { createAdminClient } from "@/lib/supabase/admin";
import { getClientsForCoach } from "@/lib/db/clients";
import { getLatestDailyLogsForClients } from "@/lib/db/daily-logs";
import { daysSince } from "@/lib/calculations/progress";
import { subDays } from "date-fns";

/** How often clients should be nudged to upload a new progress photo. */
const PHOTO_REMINDER_DAYS = 14;

/**
 * Scans a coach's active clients for overdue check-ins / workouts / progress
 * photos and inserts CLIENT-facing reminder notifications (deduped).
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
  const clientIds = activeClients.map((c) => c.id);

  const [latestLogs, photosResult] = await Promise.all([
    getLatestDailyLogsForClients(clientIds),
    clientIds.length
      ? supabase
          .from("progress_photos")
          .select("client_id, taken_at")
          .in("client_id", clientIds)
          .order("taken_at", { ascending: false })
      : Promise.resolve({ data: [] as { client_id: string; taken_at: string }[] }),
  ]);

  const latestPhotoByClient: Record<string, string> = {};
  for (const p of photosResult.data ?? []) {
    if (!latestPhotoByClient[p.client_id]) latestPhotoByClient[p.client_id] = p.taken_at;
  }

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

    if (type) {
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

    // Progress photo reminder — checked against last upload, or onboarding
    // date if they've never uploaded one. Deduped weekly rather than daily
    // so it doesn't spam once someone falls behind.
    const lastPhotoDate = latestPhotoByClient[client.id] ?? client.onboarded_at ?? client.created_at;
    const daysSincePhoto = daysSince(lastPhotoDate);
    if (daysSincePhoto !== null && daysSincePhoto >= PHOTO_REMINDER_DAYS) {
      const { data: existingPhotoNotif } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", client.user_id)
        .eq("type", "PROGRESS_PHOTO_DUE")
        .gte("created_at", subDays(new Date(), 7).toISOString())
        .maybeSingle();

      if (!existingPhotoNotif) {
        await supabase.from("notifications").insert({
          user_id: client.user_id,
          client_id: client.id,
          type: "PROGRESS_PHOTO_DUE",
          title: "Time for a new progress photo",
          body: `It's been ${daysSincePhoto} days since your last photo — upload one from your Progress page.`,
        });
      }
    }
  }
}
