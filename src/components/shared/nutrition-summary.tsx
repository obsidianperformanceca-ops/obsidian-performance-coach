import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Totals = { calories: number; proteinG: number; carbsG: number; fatG: number };
type Targets = {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

/**
 * MyFitnessPal-style "today so far" nutrition summary — consumed vs. target
 * vs. remaining, for calories + each macro. Shared between the client
 * dashboard (their own day) and the coach's food-review page (a client's
 * day), so both sides see the same numbers computed the same way.
 */
export function NutritionSummary({ consumed, target }: { consumed: Totals; target: Targets | null }) {
  if (!target || target.calories == null) {
    return (
      <Card>
        <CardHeader><CardTitle>Today&apos;s Nutrition</CardTitle></CardHeader>
        <p className="text-sm text-muted">
          {consumed.calories > 0
            ? `${consumed.calories} kcal logged so far today — no active calorie target set yet.`
            : "No meals logged yet today."}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Today&apos;s Nutrition</CardTitle></CardHeader>
      <div className="space-y-4">
        <MacroBar label="Calories" consumed={consumed.calories} target={target.calories} unit="kcal" />
        <MacroBar label="Protein" consumed={consumed.proteinG} target={target.protein_g} unit="g" />
        <MacroBar label="Carbs" consumed={consumed.carbsG} target={target.carbs_g} unit="g" />
        <MacroBar label="Fat" consumed={consumed.fatG} target={target.fat_g} unit="g" />
      </div>
    </Card>
  );
}

function MacroBar({
  label,
  consumed,
  target,
  unit,
}: {
  label: string;
  consumed: number;
  target: number | null;
  unit: string;
}) {
  if (target == null) {
    return (
      <div>
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-subtle">{consumed} {unit} logged — no target set</p>
      </div>
    );
  }

  const remaining = target - consumed;
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const over = remaining < 0;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-foreground">{label}</p>
        <p className={cn("text-xs", over ? "text-danger" : "text-subtle")}>
          {over
            ? `${Math.abs(remaining)} ${unit} over`
            : `${remaining} ${unit} left`}{" "}
          <span className="text-subtle">· {consumed}/{target} {unit}</span>
        </p>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn("h-full rounded-full transition-all", over ? "bg-danger" : "bg-accent")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
