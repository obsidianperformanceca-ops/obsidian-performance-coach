import { getClientsForCoach } from "@/lib/db/clients";
import { getWeightsForClients } from "@/lib/db/weights";
import { getLatestDailyLogsForClients, getRecentDailyLogsForClients } from "@/lib/db/daily-logs";
import { monthlyWeightChange, compliancePercent, daysSince } from "@/lib/calculations/progress";
import { subDays } from "date-fns";

export interface ClientAnalytics {
  clientId: string;
  fullName: string;
  monthlyChangeKg: number | null;
  complianceScore: number;
  daysSinceCheckIn: number | null;
}

export interface CoachAnalytics {
  avgMonthlyWeightChangeKg: number | null;
  avgCompliance: number;
  fastestProgressing: ClientAnalytics[];
  atRisk: ClientAnalytics[];
  perClient: ClientAnalytics[];
}

export async function getCoachAnalytics(coachId: string): Promise<CoachAnalytics> {
  const clients = (await getClientsForCoach(coachId)).filter((c) => c.status === "ACTIVE");
  const clientIds = clients.map((c) => c.id);

  const since90 = subDays(new Date(), 90).toISOString();
  const since7 = subDays(new Date(), 6).toISOString().slice(0, 10);

  const [weightsMap, latestLogMap, recentLogsMap] = await Promise.all([
    getWeightsForClients(clientIds, since90),
    getLatestDailyLogsForClients(clientIds),
    getRecentDailyLogsForClients(clientIds, since7),
  ]);

  const perClient: ClientAnalytics[] = clients.map((c) => {
    const weights = weightsMap[c.id] ?? [];
    const monthlyChangeKg = monthlyWeightChange(
      weights.map((w) => ({ weightKg: w.weight_kg, recordedAt: w.recorded_at }))
    );
    const recentLogs = recentLogsMap[c.id] ?? [];
    const complianceScore = compliancePercent({
      totalDays: 7,
      completedDays: recentLogs.filter((l) => l.status !== "PENDING").length,
    });
    return {
      clientId: c.id,
      fullName: c.full_name,
      monthlyChangeKg,
      complianceScore,
      daysSinceCheckIn: daysSince(latestLogMap[c.id]?.log_date ?? null),
    };
  });

  const withChange = perClient.filter((c) => c.monthlyChangeKg != null);
  const avgMonthlyWeightChangeKg =
    withChange.length > 0
      ? Math.round((withChange.reduce((a, c) => a + (c.monthlyChangeKg ?? 0), 0) / withChange.length) * 10) / 10
      : null;

  const avgCompliance =
    perClient.length > 0
      ? Math.round(perClient.reduce((a, c) => a + c.complianceScore, 0) / perClient.length)
      : 0;

  const fastestProgressing = [...withChange]
    .sort((a, b) => Math.abs(b.monthlyChangeKg ?? 0) - Math.abs(a.monthlyChangeKg ?? 0))
    .slice(0, 5);

  const atRisk = perClient
    .filter((c) => c.daysSinceCheckIn === null || c.daysSinceCheckIn >= 3)
    .sort((a, b) => (b.daysSinceCheckIn ?? 999) - (a.daysSinceCheckIn ?? 999));

  return { avgMonthlyWeightChangeKg, avgCompliance, fastestProgressing, atRisk, perClient };
}
