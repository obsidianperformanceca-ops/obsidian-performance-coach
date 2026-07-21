import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/session";
import { getOrCreateTodayLog } from "@/lib/db/daily-logs";

interface SetInput {
  exerciseId: string;
  setNumber: number;
  weightKg?: number;
  repsCompleted?: number;
  rpe?: number;
}

export async function POST(request: Request) {
  const { client } = await requireClient();
  const body = await request.json();
  const { workoutDayId, notes, sets } = body as { workoutDayId: string; notes?: string; sets: SetInput[] };

  if (!workoutDayId || !Array.isArray(sets)) {
    return NextResponse.json({ error: "workoutDayId and sets are required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      workout_day_id: workoutDayId,
      client_id: client.id,
      completed_at: new Date().toISOString(),
      notes,
    })
    .select("*")
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message ?? "Could not create session" }, { status: 500 });
  }

  // Training is now logged as-you-go rather than as part of the daily
  // check-in — so completing a workout session is what flips today's
  // workout_completed flag (used for compliance %) instead of a manual
  // checkbox in the check-in form.
  const { data: day } = await supabase.from("workout_days").select("name").eq("id", workoutDayId).maybeSingle();
  const todayLog = await getOrCreateTodayLog(client.id);
  await supabase
    .from("daily_logs")
    .update({
      workout_completed: true,
      workout_name: day?.name ?? null,
      status: todayLog.status === "PENDING" ? "SUBMITTED" : todayLog.status,
    })
    .eq("id", todayLog.id);

  // Determine PRs: for each exercise, compare against this client's best-ever weight for that exercise.
  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  const { data: priorBests } = exerciseIds.length
    ? await supabase
        .from("exercise_set_logs")
        .select("exercise_id, weight_kg")
        .in("exercise_id", exerciseIds)
        .order("weight_kg", { ascending: false })
    : { data: [] };

  const bestByExercise = new Map<string, number>();
  for (const row of priorBests ?? []) {
    if (row.weight_kg != null && !bestByExercise.has(row.exercise_id)) {
      bestByExercise.set(row.exercise_id, row.weight_kg);
    }
  }

  const setRows = sets.map((s) => {
    const prevBest = bestByExercise.get(s.exerciseId) ?? 0;
    const isPr = (s.weightKg ?? 0) > prevBest && (s.weightKg ?? 0) > 0;
    if (isPr) bestByExercise.set(s.exerciseId, s.weightKg ?? 0);
    return {
      session_id: session.id,
      exercise_id: s.exerciseId,
      set_number: s.setNumber,
      weight_kg: s.weightKg,
      reps_completed: s.repsCompleted,
      rpe: s.rpe,
      is_pr: isPr,
    };
  });

  const { error: setsError } = await supabase.from("exercise_set_logs").insert(setRows);
  if (setsError) return NextResponse.json({ error: setsError.message }, { status: 500 });

  return NextResponse.json({ success: true, sessionId: session.id, prCount: setRows.filter((s) => s.is_pr).length });
}
