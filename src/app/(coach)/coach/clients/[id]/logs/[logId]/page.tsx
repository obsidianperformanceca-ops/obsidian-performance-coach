import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireCoach } from "@/lib/auth/session";
import { getClientById } from "@/lib/db/clients";
import { getDailyLogWithMeals } from "@/lib/db/daily-logs";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/coach/profile-sections";
import { submitFoodReviewAction } from "./actions";

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
  DRINK: "Drink",
};

export default async function FoodReviewPage({
  params,
}: {
  params: Promise<{ id: string; logId: string }>;
}) {
  const { id, logId } = await params;
  await requireCoach();

  const client = await getClientById(id);
  if (!client) notFound();

  const { log, meals } = await getDailyLogWithMeals(logId);
  if (!log) notFound();

  return (
    <div>
      <PageHeader
        title={`${client.full_name} — ${format(new Date(log.log_date), "EEEE, MMM d")}`}
        description="Review the day's meals, estimate macros, and leave feedback."
        actions={<StatusBadge status={log.status} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Meals</CardTitle></CardHeader>
            {meals.length === 0 ? (
              <p className="text-sm text-muted">No meals logged for this day.</p>
            ) : (
              <div className="space-y-3">
                {meals.map((m) => (
                  <div key={m.id} className="rounded-lg bg-surface-2 p-3">
                    <Badge tone="accent">{MEAL_LABEL[m.type] ?? m.type}</Badge>
                    <p className="mt-2 text-sm text-foreground">{m.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle>Day Details</CardTitle></CardHeader>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Detail label="Morning weight" value={log.morning_weight_kg ? `${log.morning_weight_kg} kg` : "—"} />
              <Detail label="Water" value={log.water_ml ? `${log.water_ml} ml` : "—"} />
              <Detail label="Steps" value={log.steps ?? "—"} />
              <Detail label="Sleep" value={log.sleep_hours ? `${log.sleep_hours} hrs` : "—"} />
              <Detail label="Energy" value={log.energy_level ? `${log.energy_level}/10` : "—"} />
              <Detail label="Hunger" value={log.hunger_level ? `${log.hunger_level}/10` : "—"} />
              <Detail label="Workout" value={log.workout_completed ? log.workout_name || "Completed" : "Not logged"} />
              <Detail label="Digestion" value={log.digestion ?? "—"} />
            </div>
            {log.client_notes && (
              <div className="mt-4">
                <p className="text-xs text-subtle">Client notes</p>
                <p className="mt-1 text-sm text-foreground">{log.client_notes}</p>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Coach Review</CardTitle></CardHeader>
          <form action={submitFoodReviewAction.bind(null, id, logId)} className="space-y-4">
            <div>
              <Label>Estimated calories</Label>
              <Input name="estCalories" type="number" defaultValue={log.est_calories ?? ""} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Protein (g)</Label>
                <Input name="estProteinG" type="number" defaultValue={log.est_protein_g ?? ""} />
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input name="estCarbsG" type="number" defaultValue={log.est_carbs_g ?? ""} />
              </div>
              <div>
                <Label>Fat (g)</Label>
                <Input name="estFatG" type="number" defaultValue={log.est_fat_g ?? ""} />
              </div>
            </div>
            <div>
              <Label>Feedback for client</Label>
              <Textarea name="coachFeedback" defaultValue={log.coach_feedback ?? ""} placeholder="Nice work staying consistent — let's add more protein at breakfast." />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="approve" defaultChecked={log.status === "APPROVED"} className="h-4 w-4 rounded border-border" />
              Approve this day
            </label>
            <Button type="submit" className="w-full">Save review</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-subtle">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
