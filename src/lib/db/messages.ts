import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export async function getMessagesForClient(clientId: string): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(
  clientId: string,
  senderId: string,
  senderRole: "COACH" | "CLIENT",
  body: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .insert({ client_id: clientId, sender_id: senderId, sender_role: senderRole, body });
  if (error) throw error;
}

export async function getLastMessagesForClients(
  clientIds: string[]
): Promise<Record<string, MessageRow>> {
  if (clientIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .in("client_id", clientIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const map: Record<string, MessageRow> = {};
  for (const row of data ?? []) if (!map[row.client_id]) map[row.client_id] = row;
  return map;
}
