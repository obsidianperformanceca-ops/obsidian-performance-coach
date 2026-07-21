"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface ExerciseDraft {
  name: string;
  sets: string;
  reps: string;
  rpe: string;
  notes: string;
}
interface DayDraft {
  name: string;
  exercises: ExerciseDraft[];
}

const emptyExercise = (): ExerciseDraft => ({ name: "", sets: "3", reps: "8-10", rpe: "", notes: "" });
const emptyDay = (): DayDraft => ({ name: "", exercises: [emptyExercise()] });

export function ProgramBuilder({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [days, setDays] = useState<DayDraft[]>([emptyDay()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDay(i: number, patch: Partial<DayDraft>) {
    setDays((d) => d.map((day, idx) => (idx === i ? { ...day, ...patch } : day)));
  }
  function updateExercise(dayIdx: number, exIdx: number, patch: Partial<ExerciseDraft>) {
    setDays((d) =>
      d.map((day, idx) =>
        idx !== dayIdx
          ? day
          : { ...day, exercises: day.exercises.map((ex, i) => (i === exIdx ? { ...ex, ...patch } : ex)) }
      )
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        name,
        days: days.map((d) => ({
          name: d.name,
          exercises: d.exercises
            .filter((e) => e.name)
            .map((e) => ({
              name: e.name,
              sets: Number(e.sets) || 1,
              reps: e.reps,
              rpe: e.rpe ? Number(e.rpe) : undefined,
              notes: e.notes || undefined,
            })),
        })),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Could not save program");
      return;
    }
    router.refresh();
    setName("");
    setDays([emptyDay()]);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Build a new program</CardTitle></CardHeader>
      <div className="space-y-6">
        <div>
          <Label>Program name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Push / Pull / Legs" />
        </div>

        {days.map((day, dayIdx) => (
          <div key={dayIdx} className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Input
                value={day.name}
                onChange={(e) => updateDay(dayIdx, { name: e.target.value })}
                placeholder={`Day ${dayIdx + 1} name (e.g. Push)`}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setDays((d) => d.filter((_, i) => i !== dayIdx))}
                className="text-subtle hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {day.exercises.map((ex, exIdx) => (
                <div key={exIdx} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-4"
                    placeholder="Exercise"
                    value={ex.name}
                    onChange={(e) => updateExercise(dayIdx, exIdx, { name: e.target.value })}
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Sets"
                    value={ex.sets}
                    onChange={(e) => updateExercise(dayIdx, exIdx, { sets: e.target.value })}
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Reps"
                    value={ex.reps}
                    onChange={(e) => updateExercise(dayIdx, exIdx, { reps: e.target.value })}
                  />
                  <Input
                    className="col-span-2"
                    placeholder="RPE"
                    value={ex.rpe}
                    onChange={(e) => updateExercise(dayIdx, exIdx, { rpe: e.target.value })}
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Notes"
                    value={ex.notes}
                    onChange={(e) => updateExercise(dayIdx, exIdx, { notes: e.target.value })}
                  />
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  updateDay(dayIdx, { exercises: [...day.exercises, emptyExercise()] })
                }
              >
                <Plus size={14} /> Add exercise
              </Button>
            </div>
          </div>
        ))}

        <Button type="button" variant="secondary" size="sm" onClick={() => setDays((d) => [...d, emptyDay()])}>
          <Plus size={14} /> Add day
        </Button>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="button" disabled={loading || !name} onClick={handleSubmit}>
          {loading ? "Saving…" : "Save program"}
        </Button>
      </div>
    </Card>
  );
}
