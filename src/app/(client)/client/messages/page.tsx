import { requireClient } from "@/lib/auth/session";
import { getMessagesForClient } from "@/lib/db/messages";
import { PageHeader } from "@/components/shared/page-header";
import { MessageThread } from "@/components/shared/message-thread";

export default async function ClientMessagesPage() {
  const { client } = await requireClient();
  const messages = await getMessagesForClient(client.id);

  return (
    <div>
      <PageHeader title="Messages" description="Chat with your coach." />
      <MessageThread clientId={client.id} messages={messages} currentRole="CLIENT" />
    </div>
  );
}
