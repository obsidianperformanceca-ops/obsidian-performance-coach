import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCoach } from "@/lib/auth/session";
import { getClientById } from "@/lib/db/clients";
import { getActiveTarget } from "@/lib/db/targets";
import { getWeightsForClient } from "@/lib/db/weights";
import { getMeasurementsForClient } from "@/lib/db/measurements";
import { getPhotosForClient, getSignedPhotoUrls } from "@/lib/db/photos";
import { format } from "date-fns";
import { getNotesForClient } from "@/lib/db/notes";
import { getDailyLogsForClient } from "@/lib/db/daily-logs";
import { weeklyAverageWeight, weeklyWeightChange, monthlyWeightChange } from "@/lib/calculations/progress";
import { formatWeight } from "@/lib/utils/units";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { WeightChart } from "@/components/charts/weight-chart";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BasicInfoCard,
  TargetsCard,
  LifestyleCard,
  NotesCard,
  MeasurementsCard,
  RecentCheckIns,
} from "@/components/coach/profile-sections";
import {
  updateBasicInfoAction,
  updateTargetsAction,
  updateLifestyleGoalsAction,
  addNoteAction,
  addMeasurementAction,
  addWeightAction,
} from "./actions";

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireCoach();

  const client = await getClientById(id);
  if (!client) notFound();

  const [target, weights, measurements, photos, notes, logs] = await Promise.all([
    getActiveTarget(id),
    getWeightsForClient(id),
    getMeasurementsForClient(id),
    getPhotosForClient(id),
    getNotesForClient(id),
    getDailyLogsForClient(id, 14),
  ]);

  const weightPoints = weights.map((w) => ({ weightKg: w.weight_kg, recordedAt: w.recorded_at }));
  const weeklyAvg = weeklyAverageWeight(weightPoints);
  const weeklyChange = weeklyWeightChange(weightPoints);
  const monthlyChange = monthlyWeightChange(weightPoints);
  const photoUrls = await getSignedPhotoUrls(photos);

  return (
    <div>
      <PageHeader
        title={client.full_name}
        description={client.injuries ? `Injuries: ${client.injuries}` : undefined}
        actions={
          <>
            <Link href={`/coach/clients/${id}/workouts`}>
              <Button variant="secondary">Workouts</Button>
            </Link>
            <Link href={`/coach/messages/${id}`}>
              <Button variant="secondary">Messages</Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Current weight" value={formatWeight(client.current_weight_kg, client.unit_preference)} />
        <StatCard
          label="Weekly avg"
          value={weeklyAvg != null ? formatWeight(weeklyAvg, client.unit_preference) : "—"}
          sublabel={
            weeklyChange != null
              ? `${weeklyChange > 0 ? "+" : ""}${formatWeight(weeklyChange, client.unit_preference)} vs last wk`
              : undefined
          }
          trend={weeklyChange == null ? "neutral" : weeklyChange < 0 ? "up" : weeklyChange > 0 ? "down" : "neutral"}
        />
        <StatCard
          label="Monthly change"
          value={
            monthlyChange != null
              ? `${monthlyChange > 0 ? "+" : ""}${formatWeight(monthlyChange, client.unit_preference)}`
              : "—"
          }
        />
        <StatCard label="Goal weight" value={formatWeight(client.goal_weight_kg, client.unit_preference)} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Weight Progress</CardTitle>
        </CardHeader>
        {weights.length > 0 ? (
          <WeightChart
            data={weights.map((w) => ({ date: w.recorded_at, weightKg: w.weight_kg }))}
            goalWeightKg={client.goal_weight_kg}
            unit={client.unit_preference}
          />
        ) : (
          <p className="text-sm text-muted">No weight entries yet.</p>
        )}
        <form action={addWeightAction.bind(null, id)} className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <Input
              name="weightKg"
              type="number"
              step="0.1"
              placeholder={`Log a weigh-in (${client.unit_preference === "IMPERIAL" ? "lb" : "kg"})`}
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">Add</Button>
        </form>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BasicInfoCard client={client} action={updateBasicInfoAction.bind(null, id)} />
        <div className="space-y-6">
          <TargetsCard target={target} action={updateTargetsAction.bind(null, id)} />
          <LifestyleCard client={client} action={updateLifestyleGoalsAction.bind(null, id)} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentCheckIns clientId={id} logs={logs} unit={client.unit_preference} />
        <MeasurementsCard measurements={measurements} action={addMeasurementAction.bind(null, id)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NotesCard notes={notes} action={addNoteAction.bind(null, id)} />
        <Card>
          <CardHeader><CardTitle>Progress Photos</CardTitle></CardHeader>
          {photos.length === 0 ? (
            <p className="text-sm text-muted">No photos uploaded by this client yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-lg bg-surface-2">
                  {photoUrls[p.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrls[p.id]} alt="Progress" className="aspect-[3/4] w-full object-cover" />
                  ) : (
                    <div className="aspect-[3/4]" />
                  )}
                  <p className="px-2 py-1 text-center text-[10px] text-subtle">
                    {format(new Date(p.taken_at), "MMM d, yyyy")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
