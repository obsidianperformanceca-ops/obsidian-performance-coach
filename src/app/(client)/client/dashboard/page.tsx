import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { getActiveTarget } from "@/lib/db/targets";
import { getWeightsForClient } from "@/lib/db/weights";
import { getDailyLogsForClient } from "@/lib/db/daily-logs";
import { getActiveProgramForClient } from "@/lib/db/workouts";
import { computeStreak } from "@/lib/calculations/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { WeightChart } from "@/components/charts/weight-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Footprints, Dumbbell } from "lucide-react";

export default async function ClientDashboardPage() {
  const { client } = await requireClient();

  const [target, weights, logs, program] = await Promise.all([
    getActiveTarget(client.id),
    getWeightsForClient(client.id),
    getDailyLogsForClient(client.id, 30),
    getActiveProgramForClient(client.id),
  ]);

  const streak = computeStreak(
    logs.map((l) => ({
      logDate: l.log_date,
      hasActivity: l.status !== "PENDING" || l.morning_weight_kg != null,
    }))
  );

  const latestFeedback = logs.find((l) => l.coach_feedback);
  const todayLog = logs[0];

  return (
    <div>
      <PageHeader title={`Hey, ${client.full_name.split(" ")[0]}`} description="Here&apos;s your day at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Calories target" value={target?.calories ?? "—"} icon={<Flame size={16} />} />
        <StatCard label="Protein target" value={target?.protein_g ? `${target.protein_g}g` : "—"} />
        <StatCard label="Step goal" value={client.step_goal ?? "—"} icon={<Footprints size={16} />} />
        <StatCard label="Daily streak" value={`${streak} day${streak === 1 ? "" : "s"}`} icon={<Flame size={16} />} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Weight Progress</CardTitle></CardHeader>
          {weights.length > 0 ? (
            <WeightChart data={weights.map((w) => ({ date: w.recorded_at, weightKg: w.weight_kg }))} goalWeightKg={client.goal_weight_kg} />
          ) : (
            <p className="text-sm text-muted">Log your weight during today&apos;s check-in to start your graph.</p>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Today&apos;s Workout</CardTitle></CardHeader>
          {program && program.days.length > 0 ? (
            <div>
              <p className="text-sm text-foreground">{program.name}</p>
              <p className="mt-1 text-xs text-subtle">{program.days.length} day split assigned</p>
              <Link href="/client/workouts">
                <Button size="sm" className="mt-4 w-full">
                  <Dumbbell size={14} /> Go to workouts
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted">No program assigned yet.</p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Latest coach feedback</CardTitle></CardHeader>
          {latestFeedback ? (
            <div>
              <p className="text-sm text-foreground">{latestFeedback.coach_feedback}</p>
              <p className="mt-2 text-xs text-subtle">on {new Date(latestFeedback.log_date).toLocaleDateString()}</p>
            </div>
          ) : (
            <p className="text-sm text-muted">No feedback yet — check back after your coach reviews a day.</p>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Today&apos;s check-in</CardTitle></CardHeader>
          <p className="text-sm text-muted">
            {todayLog && todayLog.log_date === new Date().toISOString().slice(0, 10) && todayLog.status !== "PENDING"
              ? "You&apos;ve already submitted today&apos;s check-in. Nice work."
              : "You haven&apos;t submitted today&apos;s check-in yet."}
          </p>
          <Link href="/client/checkin">
            <Button size="sm" className="mt-4">Go to check-in</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
