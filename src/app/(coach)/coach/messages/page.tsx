import Link from "next/link";
import { requireCoach } from "@/lib/auth/session";
import { getClientsForCoach } from "@/lib/db/clients";
import { getLastMessagesForClients } from "@/lib/db/messages";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDistanceToNow } from "date-fns";

export default async function CoachMessagesPage() {
  const coach = await requireCoach();
  const clients = await getClientsForCoach(coach.id);
  const lastMessages = await getLastMessagesForClients(clients.map((c) => c.id));

  return (
    <div>
      <PageHeader title="Messages" description="Conversations with your clients." />
      {clients.length === 0 ? (
        <EmptyState title="No clients yet" description="Add a client to start messaging." />
      ) : (
        <Card className="divide-y divide-border p-0">
          {clients.map((c) => {
            const last = lastMessages[c.id];
            return (
              <Link
                key={c.id}
                href={`/coach/messages/${c.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-surface-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={c.full_name} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.full_name}</p>
                    <p className="max-w-xs truncate text-xs text-subtle">
                      {last ? last.body : "No messages yet"}
                    </p>
                  </div>
                </div>
                {last && (
                  <span className="text-xs text-subtle">
                    {formatDistanceToNow(new Date(last.created_at), { addSuffix: true })}
                  </span>
                )}
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
