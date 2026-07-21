"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FullWorkoutDay } from "@/lib/db/workouts";

interface SetEntry {
  weightKg: string;
  repsCompleted: string;
}

export function WorkoutLogger({ days }: { days: FullWorkoutDay[] }) {
  const router = useRouter();
  const [selectedDayId, setSelectedDayId] = useState(days[0]?.id ?? "");
  const selectedDay = days.find((d) => d.id === selectedDayId);
  const [setsByExercise, setSetsByExercise] = useState<Record<string, SetEntry[]>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  function setsFor(exerciseId: string, count: number): SetEntry[] {
    return (
      setsByExercise[exerciseId] ??
      Array.from({ length: count }, () => ({ weightKg: "", repsCompleted: "" }))
    );
  }

  function updateSet(exerciseId: string, count: number, idx: number, patch: Partial<SetEntry>) {
    const current = setsFor(exerciseId, count);
    const next = current.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setSetsByExercise((prev) => ({ ...prev, [exerciseId]: next }));
  }

  async function handleSubmit() {
    if (!selectedDay) return;
    setLoading(true);
    setSuccess(null);

    const sets = selectedDay.exercises.flatMap((ex) =>
      setsFor(ex.id, ex.sets)
        .map((s, i) => ({
          exerciseId: ex.id,
          setNumber: i + 1,
          weightKg: s.weightKg ? Number(s.weightKg) : undefined,
          repsCompleted: s.repsCompleted ? Number(s.repsCompleted) : undefined,
        }))
        .filter((s) => s.weightKg != null || s.repsCompleted != null)
    );

    const res = await fetch("/api/workout-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workoutDayId: selectedDay.id, sets }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setSuccess(data.prCount > 0 ? `Session logged — ${data.prCount} new PR!` : "Session logged.");
      setSetsByExercise({});
      router.refresh();
    }
  }

  if (days.length === 0) {
    return <p className="text-sm text-muted">Your coach hasn&apos;t assigned a program yet.</p>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Log today&apos;s workout</CardTitle></CardHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        {days.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDayId(d.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              d.id === selectedDayId ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {selectedDay && (
        <div className="space-y-4">
          {selectedDay.exercises.map((ex) => (
            <div key={ex.id} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{ex.name}</p>
                <p className="text-xs text-subtle">
                  Target: {ex.sets} × {ex.reps}
                  {ex.rpe ? ` @ RPE ${ex.rpe}` : ""}
                </p>
              </div>
              {ex.notes && <p className="mb-2 text-xs text-subtle">{ex.notes}</p>}
              <div className="space-y-2">
                {setsFor(ex.id, ex.sets).map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-12 text-xs text-subtle">Set {i + 1}</span>
                    <Input
                      placeholder="kg"
                      type="number"
                      step="0.5"
                      value={s.weightKg}
                      onChange={(e) => updateSet(ex.id, ex.sets, i, { weightKg: e.target.value })}
                    />
                    <Input
                      placeholder="reps"
                      type="number"
                      value={s.repsCompleted}
                      onChange={(e) => updateSet(ex.id, ex.sets, i, { repsCompleted: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {success && <p className="text-sm text-success">{success}</p>}
          <Button type="button" disabled={loading} onClick={handleSubmit}>
            {loading ? "Saving…" : "Complete workout"}
          </Button>
        </div>
      )}
    </Card>
  );
}
