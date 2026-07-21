import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth/session";
import { workoutProgramSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  await requireCoach();
  const body = await request.json();
  const { clientId, ...rest } = body;
  const parsed = workoutProgramSchema.safeParse(rest);
  if (!parsed.success || !clientId) {
    return NextResponse.json({ error: parsed.success ? "clientId required" : parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();

  // Deactivate any existing active program so there's a single source of truth.
  await supabase.from("workout_programs").update({ is_active: false }).eq("client_id", clientId).eq("is_active", true);

  const { data: program, error: programError } = await supabase
    .from("workout_programs")
    .insert({ client_id: clientId, name: parsed.data.name, notes: parsed.data.notes, is_active: true })
    .select("*")
    .single();

  if (programError || !program) {
    return NextResponse.json({ error: programError?.message ?? "Could not create program" }, { status: 500 });
  }

  for (let dayIndex = 0; dayIndex < parsed.data.days.length; dayIndex++) {
    const day = parsed.data.days[dayIndex];
    const { data: dayRow, error: dayError } = await supabase
      .from("workout_days")
      .insert({ program_id: program.id, name: day.name, day_order: dayIndex })
      .select("*")
      .single();

    if (dayError || !dayRow) continue;

    const exercisesPayload = day.exercises.map((ex, i) => ({
      workout_day_id: dayRow.id,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rpe: ex.rpe,
      notes: ex.notes,
      exercise_order: i,
    }));
    if (exercisesPayload.length > 0) {
      await supabase.from("exercises").insert(exercisesPayload);
    }
  }

  return NextResponse.json({ success: true, programId: program.id });
}
