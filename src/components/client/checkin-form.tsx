"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { submitCheckInAction } from "@/app/(client)/client/checkin/actions";
import type { DailyLogRow, MealRow } from "@/lib/db/daily-logs";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "DRINK";
interface MealDraft {
  type: MealType;
  description: string;
}

export function CheckInForm({ log, meals }: { log: DailyLogRow; meals: MealRow[] }) {
  const router = useRouter();
  const [morningWeightKg, setMorningWeightKg] = useState(log.morning_weight_kg?.toString() ?? "");
  const [waterMl, setWaterMl] = useState(log.water_ml?.toString() ?? "");
  const [workoutCompleted, setWorkoutCompleted] = useState(log.workout_completed ?? false);
  const [workoutName, setWorkoutName] = useState(log.workout_name ?? "");
  const [steps, setSteps] = useState(log.steps?.toString() ?? "");
  const [sleepHours, setSleepHours] = useState(log.sleep_hours?.toString() ?? "");
  const [energyLevel, setEnergyLevel] = useState(log.energy_level?.toString() ?? "5");
  const [hungerLevel, setHungerLevel] = useState(log.hunger_level?.toString() ?? "5");
  const [digestion, setDigestion] = useState(log.digestion ?? "");
  const [clientNotes, setClientNotes] = useState(log.client_notes ?? "");
  const [mealDrafts, setMealDrafts] = useState<MealDraft[]>(
    meals.length > 0
      ? meals.map((m) => ({ type: m.type, description: m.description }))
      : [{ type: "BREAKFAST", description: "" }]
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateMeal(i: number, patch: Partial<MealDraft>) {
    setMealDrafts((d) => d.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    await submitCheckInAction({
      logId: log.id,
      morningWeightKg: morningWeightKg ? Number(morningWeightKg) : undefined,
      waterMl: waterMl ? Number(waterMl) : undefined,
      workoutCompleted,
      workoutName: workoutName || undefined,
      steps: steps ? Number(steps) : undefined,
      sleepHours: sleepHours ? Number(sleepHours) : undefined,
      energyLevel: Number(energyLevel),
      hungerLevel: Number(hungerLevel),
      digestion: digestion || undefined,
      clientNotes: clientNotes || undefined,
      meals: mealDrafts,
    });

    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Morning Weight</CardTitle></CardHeader>
        <Input
          type="number"
          step="0.1"
          placeholder="kg"
          value={morningWeightKg}
          onChange={(e) => setMorningWeightKg(e.target.value)}
        />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meals</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-subtle">
          No need to count calories — just describe what you ate. Your coach will review it.
        </p>
        <div className="space-y-3">
          {mealDrafts.map((m, i) => (
            <div key={i} className="flex gap-2">
              <Select
                className="w-32 shrink-0"
                value={m.type}
                onChange={(e) => updateMeal(i, { type: e.target.value as MealType })}
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
                <option value="SNACK">Snack</option>
                <option value="DRINK">Drink</option>
              </Select>
              <Input
                placeholder='e.g. "2 eggs, toast, protein shake"'
                value={m.description}
                onChange={(e) => updateMeal(i, { description: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setMealDrafts((d) => d.filter((_, idx) => idx !== i))}
                className="text-subtle hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => setMealDrafts((d) => [...d, { type: "SNACK", description: "" }])}
        >
          <Plus size={14} /> Add meal or drink
        </Button>
      </Card>

      <Card>
        <CardHeader><CardTitle>Training & Activity</CardTitle></CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={workoutCompleted}
              onChange={(e) => setWorkoutCompleted(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            I completed a workout today
          </label>
          {workoutCompleted && (
            <div className="col-span-2">
              <Label>Workout name</Label>
              <Input value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} placeholder="e.g. Push Day" />
            </div>
          )}
          <div>
            <Label>Steps</Label>
            <Input type="number" value={steps} onChange={(e) => setSteps(e.target.value)} />
          </div>
          <div>
            <Label>Water (ml)</Label>
            <Input type="number" value={waterMl} onChange={(e) => setWaterMl(e.target.value)} />
          </div>
          <div>
            <Label>Sleep (hrs)</Label>
            <Input type="number" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>How are you feeling?</CardTitle></CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Energy (1-10): {energyLevel}</Label>
            <input type="range" min={1} max={10} value={energyLevel} onChange={(e) => setEnergyLevel(e.target.value)} className="w-full accent-accent" />
          </div>
          <div>
            <Label>Hunger (1-10): {hungerLevel}</Label>
            <input type="range" min={1} max={10} value={hungerLevel} onChange={(e) => setHungerLevel(e.target.value)} className="w-full accent-accent" />
          </div>
          <div className="col-span-2">
            <Label>Digestion</Label>
            <Input value={digestion} onChange={(e) => setDigestion(e.target.value)} placeholder="e.g. Normal, bloated, etc." />
          </div>
          <div className="col-span-2">
            <Label>Notes for your coach</Label>
            <Textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} />
          </div>
        </div>
      </Card>

      {saved && <p className="text-sm text-success">Check-in saved.</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving…" : "Submit check-in"}
      </Button>
    </form>
  );
}
