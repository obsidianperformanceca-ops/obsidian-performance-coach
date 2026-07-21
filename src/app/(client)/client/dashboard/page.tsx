import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { getActiveTarget } from "@/lib/db/targets";
import { getWeightsForClient } from "@/lib/db/weights";
import { getDailyLogsForClient, getOrCreateTodayLog, getDailyLogWithMeals } from "@/lib/db/daily-logs";
import { getActiveProgramForClient } from "@/lib/db/workouts";
import { computeStreak } from "@/lib/calculations/progress";
import { formatWeight } from "@/lib/utils/units";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { WeightChart } from "@/components/charts/weight-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MealQuickLog } from "@/components/client/meal-quick-log";
import { WaterStepsLog } from "@/components/client/water-steps-log";
import { Flame, Footprints, Dumbbell, Sparkles } from "lucide-react";

export default async function ClientDashboardPage() {
  const { client } = await requireClient();

  const [target, weights, logs, program, todayLog] = await Promise.all([
    getActiveTarget(client.id),
    getWeightsForClient(client.id),
    getDailyLogsForClient(client.id, 30),
    getActiveProgramForClient(client.id),
    getOrCreateTodayLog(client.id),
  ]);
  const { meals: todayMeals } = await getDailyLogWithMeals(todayLog.id);

  const streak = computeStreak(
    logs.map((l) => ({
      logDate: l.log_date,
      hasActivity: l.status !== "PENDING" || l.morning_weight_kg != null,
    }))
  );

  const latestFeedback = logs.find((l) => l.coach_feedback);
  const hasCheckedInToday = todayLog.status !== "PENDING" || todayLog.morning_weight_kg != null;

  return (
    <div>
      <PageHeader title={`Hey, ${client.full_name.split(" ")[0]}`} description="Here&apos;s your day at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Calories target" value={target?.calories ?? "—"} icon={<Flame size={16} />} />
        <StatCard label="Protein target" value={target?.protein_g ? `${target.protein_g}g` : "—"} />
        <StatCard label="Step goal" value={client.step_goal ?? "—"} icon={<Footprints size={16} />} />
        <StatCard label="Daily streak" value={`${streak} day${streak === 1 ? "" : "s"}`} icon={<Flame size={16} />} />
      </div>

      {target?.is_auto_generated && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-accent/30 bg-accent-muted px-4 py-3 text-sm text-foreground">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-accent" />
          <div>
            <p className="font-medium">Your targets were auto-adjusted</p>
            {target.adjustment_reason && <p className="mt-0.5 text-xs text-subtle">{target.adjustment_reason}</p>}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Weight Progress</CardTitle></CardHeader>
          {weights.length > 0 ? (
            <WeightChart
              data={weights.map((w) => ({ date: w.recorded_at, weightKg: w.weight_kg }))}
              goalWeightKg={client.goal_weight_kg}
              unit={client.unit_preference}
            />
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
              {todayLog.workout_completed && (
                <Badge tone="success" className="mt-2">Workout logged today</Badge>
              )}
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
        <MealQuickLog todayMeals={todayMeals} />
        <div className="space-y-6">
          <WaterStepsLog
            waterMl={todayLog.water_ml}
            steps={todayLog.steps}
            waterGoalMl={target?.water_ml}
            stepGoal={client.step_goal}
          />
          <Card>
            <CardHeader><CardTitle>Morning check-in</CardTitle></CardHeader>
            <p className="text-sm text-muted">
              {hasCheckedInToday
                ? `You've already logged today's weight and feeling. Current: ${formatWeight(client.current_weight_kg, client.unit_preference)}.`
                : "You haven't logged your morning weight and feeling yet today."}
            </p>
            <Link href="/client/checkin">
              <Button size="sm" className="mt-4">Go to check-in</Button>
            </Link>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
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
    </div>
  );
}
