import { Flame, Droplets, Footprints, Dumbbell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/**
 * MyFitnessPal-style habit streak chips — one per habit, so consistency in
 * (say) water logging is visible even on a day the workout was skipped.
 * Streak counts are computed server-side in the dashboard page with
 * computeStreak() and different per-habit predicates.
 */
export function HabitStreaks({
  logging,
  water,
  steps,
  workouts,
}: {
  logging: number;
  water: number;
  steps: number;
  workouts: number;
}) {
  const items = [
    { label: "Logging", value: logging, icon: Flame },
    { label: "Water", value: water, icon: Droplets },
    { label: "Steps", value: steps, icon: Footprints },
    { label: "Workouts", value: workouts, icon: Dumbbell },
  ];

  return (
    <Card>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 py-1 text-center">
            <item.icon
              size={18}
              className={cn(item.value > 0 ? "text-accent" : "text-subtle")}
            />
            <p className={cn("text-lg font-semibold tracking-tight", item.value > 0 ? "text-foreground" : "text-subtle")}>
              {item.value}
            </p>
            <p className="text-[10px] text-subtle">
              {item.label} streak
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
