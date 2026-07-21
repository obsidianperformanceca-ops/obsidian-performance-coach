import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/session";
import { getOrCreateTodayLog } from "@/lib/db/daily-logs";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "DRINK"] as const;

export async function POST(request: Request) {
  const { client } = await requireClient();
  const body = await request.json();
  const { type, description } = body as { type?: string; description?: string };

  if (!type || !MEAL_TYPES.includes(type as (typeof MEAL_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid meal type" }, { status: 400 });
  }
  if (!description || !description.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  const todayLog = await getOrCreateTodayLog(client.id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meals")
    .insert({ daily_log_id: todayLog.id, type: type as (typeof MEAL_TYPES)[number], description: description.trim() })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Logging a meal counts as engaging with nutrition for the day — flip the
  // log out of PENDING so coach food-review/compliance sees activity even
  // before the (now separate) morning check-in is submitted.
  if (todayLog.status === "PENDING") {
    await supabase.from("daily_logs").update({ status: "SUBMITTED" }).eq("id", todayLog.id);
  }

  return NextResponse.json({ success: true, meal: data });
}

export async function DELETE(request: Request) {
  await requireClient();
  const { searchParams } = new URL(request.url);
  const mealId = searchParams.get("id");
  if (!mealId) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("meals").delete().eq("id", mealId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
