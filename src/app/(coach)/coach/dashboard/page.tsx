import Link from "next/link";
import { requireCoach } from "@/lib/auth/session";
import { getCoachDashboardData } from "@/lib/db/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ClientCard } from "@/components/coach/client-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Users, UserCheck, AlertTriangle, CalendarClock } from "lucide-react";

export default async function CoachDashboardPage() {
  const coach = await requireCoach();
  const data = await getCoachDashboardData(coach.id);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${coach.full_name?.split(" ")[0] ?? "Coach"}`}
        description="Here's how your roster is trending."
        actions={
          <Link href="/coach/clients/new">
            <Button>Add client</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clients" value={data.totalClients} icon={<Users size={16} />} />
        <StatCard label="Active clients" value={data.activeClients} icon={<UserCheck size={16} />} />
        <StatCard
          label="Haven't checked in"
          value={data.missedCheckIns.length}
          sublabel={data.missedCheckIns.length > 0 ? "2+ days since last log" : "Everyone's on track"}
          trend={data.missedCheckIns.length > 0 ? "down" : "up"}
          icon={<AlertTriangle size={16} />}
        />
        <StatCard
          label="Weekly check-ins due"
          value={data.upcomingWeeklyCheckIns.length}
          icon={<CalendarClock size={16} />}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-foreground">Latest check-ins</h2>
          {data.latestCheckIns.length === 0 ? (
            <p className="text-sm text-muted">No check-ins yet.</p>
          ) : (
            <div className="space-y-3">
              {data.latestCheckIns.map(({ client, logDate }) => (
                <Link
                  key={client.id}
                  href={`/coach/clients/${client.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-2"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={client.full_name} size={30} />
                    <span className="text-sm text-foreground">{client.full_name}</span>
                  </div>
                  <span className="text-xs text-subtle">
                    {formatDistanceToNow(new Date(logDate), { addSuffix: true })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-medium text-foreground">Needs attention</h2>
          {data.missedCheckIns.length === 0 ? (
            <p className="text-sm text-muted">Nobody is overdue right now.</p>
          ) : (
            <div className="space-y-3">
              {data.missedCheckIns.slice(0, 6).map((client) => (
                <Link
                  key={client.id}
                  href={`/coach/clients/${client.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-2"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={client.full_name} size={28} />
                    <span className="text-sm text-foreground">{client.full_name}</span>
                  </div>
                  <Badge tone="danger">At risk</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-sm font-medium text-foreground">Client progress overview</h2>
        {data.clients.length === 0 ? (
          <EmptyState
            title="No clients yet"
            description="Add your first client to start tracking their nutrition, training, and progress."
            action={
              <Link href="/coach/clients/new">
                <Button>Add client</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
