import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type WorkoutProgramRow = Database["public"]["Tables"]["workout_programs"]["Row"];
export type WorkoutDayRow = Database["public"]["Tables"]["workout_days"]["Row"];
export type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];
export type WorkoutSessionRow = Database["public"]["Tables"]["workout_sessions"]["Row"];
export type ExerciseSetLogRow = Database["public"]["Tables"]["exercise_set_logs"]["Row"];

export interface FullWorkoutDay extends WorkoutDayRow {
  exercises: ExerciseRow[];
}
export interface FullWorkoutProgram extends WorkoutProgramRow {
  days: FullWorkoutDay[];
}

export async function getActiveProgramForClient(clientId: string): Promise<FullWorkoutProgram | null> {
  const supabase = await createClient();
  const { data: program } = await supabase
    .from("workout_programs")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!program) return null;

  const { data: days } = await supabase
    .from("workout_days")
    .select("*")
    .eq("program_id", program.id)
    .order("day_order", { ascending: true });

  const dayIds = (days ?? []).map((d) => d.id);
  const { data: exercises } = dayIds.length
    ? await supabase
        .from("exercises")
        .select("*")
        .in("workout_day_id", dayIds)
        .order("exercise_order", { ascending: true })
    : { data: [] as ExerciseRow[] };

  const fullDays: FullWorkoutDay[] = (days ?? []).map((d) => ({
    ...d,
    exercises: (exercises ?? []).filter((e) => e.workout_day_id === d.id),
  }));

  return { ...program, days: fullDays };
}

export async function getSessionHistoryForClient(clientId: string, limit = 20): Promise<WorkoutSessionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("client_id", clientId)
    .order("scheduled_for", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getSetLogsForSessions(sessionIds: string[]): Promise<Record<string, ExerciseSetLogRow[]>> {
  if (sessionIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_set_logs")
    .select("*")
    .in("session_id", sessionIds);
  if (error) throw error;
  const map: Record<string, ExerciseSetLogRow[]> = {};
  for (const row of data ?? []) (map[row.session_id] ??= []).push(row);
  return map;
}

export async function getPersonalRecords(clientId: string): Promise<Record<string, ExerciseSetLogRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_set_logs")
    .select("*, workout_sessions!inner(client_id)")
    .eq("workout_sessions.client_id", clientId)
    .eq("is_pr", true);
  if (error) throw error;
  const map: Record<string, ExerciseSetLogRow> = {};
  for (const row of (data as unknown as ExerciseSetLogRow[]) ?? []) {
    const existing = map[row.exercise_id];
    if (!existing || (row.weight_kg ?? 0) > (existing.weight_kg ?? 0)) {
      map[row.exercise_id] = row;
    }
  }
  return map;
}
