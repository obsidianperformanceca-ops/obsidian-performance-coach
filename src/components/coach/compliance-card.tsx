import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

/**
 * 30-day adherence snapshot for the coach — how consistently the client
 * hit each pillar. Uses complianceBreakdown() computed in the page.
 */
export function ComplianceCard({
  breakdown,
  days,
  hasStepGoal,
}: {
  breakdown: { workout: number; nutrition: number; steps: number };
  days: number;
  hasStepGoal: boolean;
}) {
  const rows = [
    { label: "Nutrition logging", value: breakdown.nutrition },
    { label: "Workouts", value: breakdown.workout },
    ...(hasStepGoal ? [{ label: "Step goal", value: breakdown.steps }] : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adherence — last {days} days</CardTitle>
      </CardHeader>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-foreground">{r.label}</span>
              <span className="text-subtle">{r.value}%</span>
            </div>
            <ProgressBar value={r.value} />
          </div>
        ))}
      </div>
    </Card>
  );
}
