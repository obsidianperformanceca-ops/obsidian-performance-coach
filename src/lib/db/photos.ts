import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ProgressPhotoRow = Database["public"]["Tables"]["progress_photos"]["Row"];

export async function getPhotosForClient(clientId: string): Promise<ProgressPhotoRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("client_id", clientId)
    .order("taken_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
