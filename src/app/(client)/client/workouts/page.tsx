import { requireClient } from "@/lib/auth/session";
import { getActiveProgramForClient, getSessionHistoryForClient } from "@/lib/db/workouts";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkoutLogger } from "@/components/client/workout-logger";
import { format } from "date-fns";

export default async function ClientWorkoutsPage() {
  const { client } = await requireClient();
  const [program, sessions] = await Promise.all([
    getActiveProgramForClient(client.id),
    getSessionHistoryForClient(client.id, 10),
  ]);

  return (
    <div>
      <PageHeader title="Workouts" description={program ? program.name : "No program assigned yet"} />

      <WorkoutLogger days={program?.days ?? []} />

      <Card className="mt-6">
        <CardHeader><CardTitle>History</CardTitle></CardHeader>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted">No workouts logged yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <span className="text-foreground">{format(new Date(s.scheduled_for), "EEE, MMM d")}</span>
                <Badge tone={s.completed_at ? "success" : "neutral"}>
                  {s.completed_at ? "Completed" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
