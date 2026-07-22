import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/session";
import { getOrCreateTodayLog } from "@/lib/db/daily-logs";

// MyFitnessPal-style "copy yesterday" — people eat repetitively, so
// re-logging yesterday's meals wholesale is the fastest path to a complete
// day. Copies descriptions, serving sizes, AND macro estimates, so the
// remaining-calories math updates instantly without re-estimating.
export async function POST() {
  const { client } = await requireClient();
  const supabase = await createClient();

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const { data: yesterdayLog } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("client_id", client.id)
    .eq("log_date", yesterday)
    .maybeSingle();

  if (!yesterdayLog) {
    return NextResponse.json({ error: "No meals were logged yesterday." }, { status: 404 });
  }

  const { data: yesterdayMeals } = await supabase
    .from("meals")
    .select("type, description, serving_size, est_calories, est_protein_g, est_carbs_g, est_fat_g")
    .eq("daily_log_id", yesterdayLog.id);

  if (!yesterdayMeals || yesterdayMeals.length === 0) {
    return NextResponse.json({ error: "No meals were logged yesterday." }, { status: 404 });
  }

  const todayLog = await getOrCreateTodayLog(client.id);

  const { error } = await supabase.from("meals").insert(
    yesterdayMeals.map((m) => ({ ...m, daily_log_id: todayLog.id }))
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (todayLog.status === "PENDING") {
    await supabase.from("daily_logs").update({ status: "SUBMITTED" }).eq("id", todayLog.id);
  }

  return NextResponse.json({ success: true, copied: yesterdayMeals.length });
}
