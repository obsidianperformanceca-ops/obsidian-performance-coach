import Link from "next/link";
import { requireCoach } from "@/lib/auth/session";
import { getCoachDashboardData } from "@/lib/db/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { ClientCard } from "@/components/coach/client-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default async function ClientsPage() {
  const coach = await requireCoach();
  const data = await getCoachDashboardData(coach.id);

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${data.totalClients} total · ${data.activeClients} active`}
        actions={
          <Link href="/coach/clients/new">
            <Button>Add client</Button>
          </Link>
        }
      />
      {data.clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add your first client to get started."
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
  );
}
