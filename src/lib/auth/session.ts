import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

/** Current authenticated app user (public.users row), or null. */
export async function getCurrentUser(): Promise<UserRow | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data } = await supabase.from("users").select("*").eq("id", authUser.id).single();
  return data ?? null;
}

/** Redirects to /login if not authenticated, or to the wrong dashboard if role mismatches. */
export async function requireCoach(): Promise<UserRow> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "COACH") redirect("/client/dashboard");
  return user;
}

export async function requireClient(): Promise<{ user: UserRow; client: ClientRow }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CLIENT") redirect("/coach/dashboard");

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/login");
  return { user, client: client! };
}
