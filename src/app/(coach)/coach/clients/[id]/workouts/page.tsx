import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireCoach } from "@/lib/auth/session";
import { getClientById } from "@/lib/db/clients";
import { getActiveProgramForClient, getSessionHistoryForClient, getSetLogsForSessions } from "@/lib/db/workouts";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgramBuilder } from "@/components/coach/program-builder";

export default async function ClientWorkoutsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireCoach();

  const client = await getClientById(id);
  if (!client) notFound();

  const [program, sessions] = await Promise.all([
    getActiveProgramForClient(id),
    getSessionHistoryForClient(id),
  ]);
  const setLogsBySession = await getSetLogsForSessions(sessions.map((s) => s.id));

  return (
    <div>
      <PageHeader title={`${client.full_name} — Workouts`} description="Assigned program, session history, and PRs." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{program ? program.name : "No active program"}</CardTitle></CardHeader>
          {program ? (
            <div className="space-y-4">
              {program.days.map((day) => (
                <div key={day.id}>
                  <p className="mb-2 text-sm font-medium text-foreground">{day.name}</p>
                  <div className="space-y-1">
                    {day.exercises.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                        <span className="text-foreground">{ex.name}</span>
                        <span className="text-subtle">
                          {ex.sets} × {ex.reps}
                          {ex.rpe ? ` @ RPE ${ex.rpe}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Assign a program using the builder to get started.</p>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Session history</CardTitle></CardHeader>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted">No sessions logged yet.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => {
                const setLogs = setLogsBySession[s.id] ?? [];
                const prCount = setLogs.filter((l) => l.is_pr).length;
                return (
                  <div key={s.id} className="rounded-lg bg-surface-2 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">
                        {format(new Date(s.scheduled_for), "MMM d, yyyy")}
                      </span>
                      <div className="flex gap-2">
                        {prCount > 0 && <Badge tone="success">{prCount} PR{prCount > 1 ? "s" : ""}</Badge>}
                        <Badge tone={s.completed_at ? "success" : "neutral"}>
                          {s.completed_at ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                    {setLogs.length > 0 && (
                      <p className="mt-1 text-xs text-subtle">{setLogs.length} sets logged</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <ProgramBuilder clientId={id} />
      </div>
    </div>
  );
}
