import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/session";
import { getOrCreateTodayLog } from "@/lib/db/daily-logs";
import type { Database } from "@/types/database";

type DailyLogUpdate = Database["public"]["Tables"]["daily_logs"]["Update"];

export async function POST(request: Request) {
  const { client } = await requireClient();
  const body = await request.json();
  const { addWaterMl, steps } = body as { addWaterMl?: number; steps?: number };

  const todayLog = await getOrCreateTodayLog(client.id);
  const supabase = await createClient();

  const update: DailyLogUpdate = {};
  if (typeof addWaterMl === "number" && addWaterMl > 0) {
    update.water_ml = (todayLog.water_ml ?? 0) + addWaterMl;
  }
  if (typeof steps === "number" && steps >= 0) {
    update.steps = steps;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  if (todayLog.status === "PENDING") {
    update.status = "SUBMITTED";
  }

  const { data, error } = await supabase
    .from("daily_logs")
    .update(update)
    .eq("id", todayLog.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, log: data });
}
