"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Droplet, Footprints } from "lucide-react";

export function WaterStepsLog({
  waterMl,
  steps,
  waterGoalMl,
  stepGoal,
}: {
  waterMl: number | null;
  steps: number | null;
  waterGoalMl?: number | null;
  stepGoal?: number | null;
}) {
  const router = useRouter();
  const [stepsInput, setStepsInput] = useState(steps?.toString() ?? "");
  const [loadingWater, setLoadingWater] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(false);

  async function addWater(amountMl: number) {
    setLoadingWater(true);
    await fetch("/api/daily-log/today", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addWaterMl: amountMl }),
    });
    setLoadingWater(false);
    router.refresh();
  }

  async function saveSteps() {
    if (!stepsInput) return;
    setLoadingSteps(true);
    await fetch("/api/daily-log/today", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps: Number(stepsInput) }),
    });
    setLoadingSteps(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Water & Steps</CardTitle></CardHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-foreground">
            <Droplet size={16} className="text-accent" />
            {waterMl ?? 0}ml{waterGoalMl ? ` / ${waterGoalMl}ml` : ""}
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={loadingWater} onClick={() => addWater(250)}>
              +250ml
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={loadingWater} onClick={() => addWater(500)}>
              +500ml
            </Button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-foreground">
            <Footprints size={16} className="text-accent" />
            Steps today{stepGoal ? ` (goal ${stepGoal})` : ""}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="e.g. 8500"
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              className="flex-1"
            />
            <Button type="button" size="sm" variant="secondary" disabled={loadingSteps} onClick={saveSteps}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
