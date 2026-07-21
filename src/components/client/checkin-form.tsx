"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitCheckInAction } from "@/app/(client)/client/checkin/actions";
import { displayWeight, weightToKg } from "@/lib/utils/units";
import type { DailyLogRow } from "@/lib/db/daily-logs";
import type { UnitPreference } from "@/types/database";

export function CheckInForm({ log, unit }: { log: DailyLogRow; unit: UnitPreference }) {
  const router = useRouter();
  const [morningWeight, setMorningWeight] = useState(
    log.morning_weight_kg != null ? String(displayWeight(log.morning_weight_kg, unit)) : ""
  );
  const [energyLevel, setEnergyLevel] = useState(log.energy_level?.toString() ?? "5");
  const [hungerLevel, setHungerLevel] = useState(log.hunger_level?.toString() ?? "5");
  const [digestion, setDigestion] = useState(log.digestion ?? "");
  const [clientNotes, setClientNotes] = useState(log.client_notes ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    try {
      await submitCheckInAction({
        logId: log.id,
        morningWeightKg: morningWeight ? weightToKg(Number(morningWeight), unit) : undefined,
        energyLevel: Number(energyLevel),
        hungerLevel: Number(hungerLevel),
        digestion: digestion || undefined,
        clientNotes: clientNotes || undefined,
      });
      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not save your check-in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Morning Weight</CardTitle></CardHeader>
        <Input
          type="number"
          step="0.1"
          placeholder={unit === "IMPERIAL" ? "lb" : "kg"}
          value={morningWeight}
          onChange={(e) => setMorningWeight(e.target.value)}
        />
      </Card>

      <Card>
        <CardHeader><CardTitle>How are you feeling?</CardTitle></CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Energy (1-10): {energyLevel}</Label>
            <input
              type="range"
              min={1}
              max={10}
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value)}
              className="w-full accent-accent"
            />
          </div>
          <div>
            <Label>Hunger (1-10): {hungerLevel}</Label>
            <input
              type="range"
              min={1}
              max={10}
              value={hungerLevel}
              onChange={(e) => setHungerLevel(e.target.value)}
              className="w-full accent-accent"
            />
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

      <p className="text-xs text-subtle">
        Logging meals, water, steps, and workouts? Do that as you go from your Dashboard — this check-in is just
        your morning weight and how you&apos;re feeling.
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Check-in saved.</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving…" : "Submit check-in"}
      </Button>
    </form>
  );
}
