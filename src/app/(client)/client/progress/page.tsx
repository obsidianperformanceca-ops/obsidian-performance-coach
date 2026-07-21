import { requireClient } from "@/lib/auth/session";
import { getWeightsForClient } from "@/lib/db/weights";
import { getMeasurementsForClient } from "@/lib/db/measurements";
import { getPhotosForClient } from "@/lib/db/photos";
import { getDailyLogsForClient } from "@/lib/db/daily-logs";
import {
  weeklyAverageWeight,
  weeklyWeightChange,
  monthlyWeightChange,
  complianceBreakdown,
} from "@/lib/calculations/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { WeightChart } from "@/components/charts/weight-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

export default async function ClientProgressPage() {
  const { client } = await requireClient();

  const [weights, measurements, photos, logs] = await Promise.all([
    getWeightsForClient(client.id),
    getMeasurementsForClient(client.id),
    getPhotosForClient(client.id),
    getDailyLogsForClient(client.id, 30),
  ]);

  const weightPoints = weights.map((w) => ({ weightKg: w.weight_kg, recordedAt: w.recorded_at }));
  const weeklyAvg = weeklyAverageWeight(weightPoints);
  const weeklyChange = weeklyWeightChange(weightPoints);
  const monthlyChange = monthlyWeightChange(weightPoints);
  const compliance = complianceBreakdown(
    logs.map((l) => ({ status: l.status, workoutCompleted: l.workout_completed, steps: l.steps })),
    client.step_goal,
    30
  );
  const latestMeasurement = measurements[0];

  return (
    <div>
      <PageHeader title="Your Progress" description="Weight, measurements, and consistency over time." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Weekly average" value={weeklyAvg != null ? `${weeklyAvg} kg` : "—"} />
        <StatCard
          label="Weekly change"
          value={weeklyChange != null ? `${weeklyChange > 0 ? "+" : ""}${weeklyChange} kg` : "—"}
          trend={weeklyChange == null ? "neutral" : weeklyChange < 0 ? "up" : weeklyChange > 0 ? "down" : "neutral"}
        />
        <StatCard label="Monthly change" value={monthlyChange != null ? `${monthlyChange > 0 ? "+" : ""}${monthlyChange} kg` : "—"} />
        <StatCard label="Goal weight" value={client.goal_weight_kg ? `${client.goal_weight_kg} kg` : "—"} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Weight over time</CardTitle></CardHeader>
        {weights.length > 0 ? (
          <WeightChart data={weights.map((w) => ({ date: w.recorded_at, weightKg: w.weight_kg }))} goalWeightKg={client.goal_weight_kg} />
        ) : (
          <p className="text-sm text-muted">No weight entries yet.</p>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Compliance (last 30 days)</CardTitle></CardHeader>
          <div className="space-y-4">
            <ComplianceRow label="Workout" value={compliance.workout} />
            <ComplianceRow label="Nutrition logging" value={compliance.nutrition} />
            <ComplianceRow label="Steps" value={compliance.steps} />
            <ComplianceRow label="Cardio" value={compliance.cardio} />
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Latest measurements</CardTitle></CardHeader>
          {latestMeasurement ? (
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <MStat label="Waist" v={latestMeasurement.waist_cm} />
              <MStat label="Chest" v={latestMeasurement.chest_cm} />
              <MStat label="Hips" v={latestMeasurement.hips_cm} />
              <MStat label="Arm" v={latestMeasurement.arm_cm} />
              <MStat label="Thigh" v={latestMeasurement.thigh_cm} />
            </div>
          ) : (
            <p className="text-sm text-muted">Your coach hasn&apos;t logged any measurements yet.</p>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Progress Photos</CardTitle></CardHeader>
        {photos.length === 0 ? (
          <p className="text-sm text-muted">No progress photos yet.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="aspect-[3/4] rounded-lg bg-surface-2" />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ComplianceRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-subtle">{value}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function MStat({ label, v }: { label: string; v: number | null }) {
  return (
    <div className="rounded-lg bg-surface-2 py-2">
      <p className="text-xs text-subtle">{label}</p>
      <p className="font-medium text-foreground">{v != null ? `${v}cm` : "—"}</p>
    </div>
  );
}
