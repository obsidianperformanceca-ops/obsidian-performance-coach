import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CoachNoteRow = Database["public"]["Tables"]["coach_notes"]["Row"];

export async function getNotesForClient(clientId: string): Promise<CoachNoteRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_notes")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addNote(clientId: string, authorId: string, body: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("coach_notes").insert({ client_id: clientId, author_id: authorId, body });
  if (error) throw error;
}
