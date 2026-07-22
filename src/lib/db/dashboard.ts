import { getClientsForCoach, type ClientRow } from "@/lib/db/clients";
import { getWeightsForClients } from "@/lib/db/weights";
import { getActiveTargetsForClients } from "@/lib/db/targets";
import { getLatestDailyLogsForClients, getRecentDailyLogsForClients } from "@/lib/db/daily-logs";
import { weeklyAverageWeight, weeklyWeightChange, daysSince, compliancePercent } from "@/lib/calculations/progress";
import { subDays } from "date-fns";
import type { ClientCardData } from "@/components/coach/client-card";

export interface TriageItem {
  client: ClientRow;
  reasons: string[];
  severity: "high" | "medium";
}

export interface CoachDashboardData {
  clients: ClientCardData[];
  totalClients: number;
  activeClients: number;
  missedCheckIns: ClientRow[];
  latestCheckIns: { client: ClientRow; logDate: string }[];
  upcomingWeeklyCheckIns: ClientRow[];
  triage: TriageItem[];
}

export async function getCoachDashboardData(coachId: string): Promise<CoachDashboardData> {
  const clients = await getClientsForCoach(coachId);
  const clientIds = clients.map((c) => c.id);

  const since30 = subDays(new Date(), 30).toISOString();
  const since7 = subDays(new Date(), 6).toISOString().slice(0, 10);

  const [weightsMap, targetsMap, latestLogMap, recentLogsMap] = await Promise.all([
    getWeightsForClients(clientIds, since30),
    getActiveTargetsForClients(clientIds),
    getLatestDailyLogsForClients(clientIds),
    getRecentDailyLogsForClients(clientIds, since7),
  ]);

  const clientCards: ClientCardData[] = clients.map((c) => {
    const weights = weightsMap[c.id] ?? [];
    const target = targetsMap[c.id];
    const latestLog = latestLogMap[c.id];
    const recentLogs = recentLogsMap[c.id] ?? [];

    const weeklyAvg = weeklyAverageWeight(weights.map((w) => ({ weightKg: w.weight_kg, recordedAt: w.recorded_at })));
    const weeklyChange = weeklyWeightChange(weights.map((w) => ({ weightKg: w.weight_kg, recordedAt: w.recorded_at })));

    return {
      id: c.id,
      fullName: c.full_name,
      currentWeightKg: c.current_weight_kg ?? weeklyAvg,
      weeklyChangeKg: weeklyChange,
      goal: c.goal,
      calories: target?.calories ?? null,
      proteinG: target?.protein_g ?? null,
      lastCheckIn: latestLog?.log_date ?? null,
      complianceScore: compliancePercent({
        totalDays: 7,
        completedDays: recentLogs.filter((l) => l.status !== "PENDING").length,
      }),
      status: c.status,
      unitPreference: c.unit_preference,
    };
  });

  const missedCheckIns = clients.filter((c) => {
    const last = latestLogMap[c.id]?.log_date ?? null;
    const days = daysSince(last);
    return c.status === "ACTIVE" && (days === null || days >= 2);
  });

  const latestCheckIns = clients
    .filter((c) => latestLogMap[c.id])
    .map((c) => ({ client: c, logDate: latestLogMap[c.id].log_date }))
    .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime())
    .slice(0, 6);

  // Heuristic: a weekly check-in is "upcoming/due" once 7+ days have passed
  // since the client's last check-in — swap for a real per-client schedule
  // (e.g. a `next_checkin_at` column) once that workflow is defined.
  const upcomingWeeklyCheckIns = clients.filter((c) => {
    const days = daysSince(latestLogMap[c.id]?.log_date ?? null);
    return c.status === "ACTIVE" && days !== null && days >= 6;
  });

  // Triage queue — surfaces WHY each client needs attention, ranked. Only
  // active clients; a client can appear for multiple reasons.
  const triage: TriageItem[] = [];
  for (const c of clients) {
    if (c.status !== "ACTIVE") continue;
    const reasons: string[] = [];
    let high = false;

    const lastLog = latestLogMap[c.id]?.log_date ?? null;
    const daysGone = daysSince(lastLog);
    if (daysGone === null) {
      reasons.push("Never checked in");
      high = true;
    } else if (daysGone >= 3) {
      reasons.push(`No check-in in ${daysGone} days`);
      high = true;
    } else if (daysGone >= 2) {
      reasons.push(`No check-in in ${daysGone} days`);
    }

    // Weight stalled: 2+ weeks of data but essentially no movement.
    const weights = weightsMap[c.id] ?? [];
    if (weights.length >= 2 && c.goal && c.goal !== "MAINTENANCE" && c.goal !== "GENERAL_HEALTH") {
      const change = weeklyWeightChange(weights.map((w) => ({ weightKg: w.weight_kg, recordedAt: w.recorded_at })));
      if (change !== null && Math.abs(change) < 0.1) {
        reasons.push("Weight stalled this week");
      }
    }

    // Unreviewed submitted food days in the last week.
    const recentLogs = recentLogsMap[c.id] ?? [];
    const unreviewed = recentLogs.filter((l) => l.status === "SUBMITTED").length;
    if (unreviewed > 0) {
      reasons.push(`${unreviewed} day${unreviewed === 1 ? "" : "s"} to review`);
    }

    if (reasons.length > 0) {
      triage.push({ client: c, reasons, severity: high ? "high" : "medium" });
    }
  }
  triage.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "high" ? -1 : 1;
    return b.reasons.length - a.reasons.length;
  });

  return {
    clients: clientCards,
    totalClients: clients.length,
    activeClients: clients.filter((c) => c.status === "ACTIVE").length,
    missedCheckIns,
    latestCheckIns,
    upcomingWeeklyCheckIns,
    triage,
  };
}
