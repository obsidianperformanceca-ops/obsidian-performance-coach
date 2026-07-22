import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/session";

// Start a fast (POST with no body) or end the active one (POST {action:"end"}).
// One active fast at a time — starting while one is running is a no-op
// that returns the existing fast, so double-taps can't create duplicates.
export async function POST(request: Request) {
  const { client } = await requireClient();
  const supabase = await createClient();

  let action = "start";
  try {
    const body = await request.json();
    if (body?.action === "end") action = "end";
  } catch {
    // no body — default to start
  }

  const { data: active } = await supabase
    .from("fasts")
    .select("*")
    .eq("client_id", client.id)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .maybeSingle();

  if (action === "end") {
    if (!active) return NextResponse.json({ error: "No fast in progress" }, { status: 400 });
    const { data, error } = await supabase
      .from("fasts")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", active.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, fast: data });
  }

  if (active) return NextResponse.json({ success: true, fast: active });

  const { data, error } = await supabase
    .from("fasts")
    .insert({ client_id: client.id })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, fast: data });
}
