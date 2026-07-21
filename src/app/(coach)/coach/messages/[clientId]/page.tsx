import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth/session";
import { getClientById } from "@/lib/db/clients";
import { getMessagesForClient } from "@/lib/db/messages";
import { PageHeader } from "@/components/shared/page-header";
import { MessageThread } from "@/components/shared/message-thread";

export default async function CoachMessageThreadPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  await requireCoach();

  const client = await getClientById(clientId);
  if (!client) notFound();

  const messages = await getMessagesForClient(clientId);

  return (
    <div>
      <PageHeader title={client.full_name} />
      <MessageThread clientId={clientId} messages={messages} currentRole="COACH" />
    </div>
  );
}
