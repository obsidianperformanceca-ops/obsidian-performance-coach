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

/** Signed URLs (1hr expiry) for a set of progress photos — the bucket is private. */
export async function getSignedPhotoUrls(photos: ProgressPhotoRow[]): Promise<Record<string, string>> {
  if (photos.length === 0) return {};
  const supabase = await createClient();
  const urls: Record<string, string> = {};
  await Promise.all(
    photos.map(async (p) => {
      const { data } = await supabase.storage.from("progress-photos").createSignedUrl(p.storage_path, 3600);
      if (data?.signedUrl) urls[p.id] = data.signedUrl;
    })
  );
  return urls;
}
