"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Trash2, Coffee, Sandwich, UtensilsCrossed, Cookie, GlassWater } from "lucide-react";
import type { MealRow } from "@/lib/db/daily-logs";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "DRINK";

const MEAL_META: { type: MealType; label: string; icon: typeof Coffee }[] = [
  { type: "BREAKFAST", label: "Breakfast", icon: Coffee },
  { type: "LUNCH", label: "Lunch", icon: Sandwich },
  { type: "DINNER", label: "Dinner", icon: UtensilsCrossed },
  { type: "SNACK", label: "Snack", icon: Cookie },
  { type: "DRINK", label: "Drink", icon: GlassWater },
];

export function MealQuickLog({ todayMeals }: { todayMeals: MealRow[] }) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<MealType | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLog() {
    if (!activeType || !description.trim()) return;
    setLoading(true);
    await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: activeType, description }),
    });
    setLoading(false);
    setDescription("");
    setActiveType(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  const mealsByType = MEAL_META.map((m) => ({
    ...m,
    entries: todayMeals.filter((meal) => meal.type === m.type),
  }));

  return (
    <Card>
      <CardHeader><CardTitle>Log meals as you go</CardTitle></CardHeader>
      <p className="mb-4 text-xs text-subtle">
        No need to wait until end of day — tap a meal when you eat it and describe what you had. Your coach reviews
        it from there.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {MEAL_META.map((m) => (
          <button
            key={m.type}
            type="button"
            onClick={() => setActiveType(m.type)}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-3 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            <m.icon size={18} />
            {m.label}
          </button>
        ))}
      </div>

      {mealsByType.some((m) => m.entries.length > 0) && (
        <div className="mt-4 space-y-2">
          {mealsByType.map(
            (m) =>
              m.entries.length > 0 && (
                <div key={m.type}>
                  <p className="mb-1 text-xs font-medium text-subtle">{m.label}</p>
                  <div className="space-y-1">
                    {m.entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                        <span className="text-foreground">{entry.description}</span>
                        <button type="button" onClick={() => handleDelete(entry.id)} className="text-subtle hover:text-danger">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}

      {activeType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Log {MEAL_META.find((m) => m.type === activeType)?.label}
              </h3>
              <button type="button" onClick={() => setActiveType(null)} className="text-subtle hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <Textarea
              autoFocus
              placeholder='e.g. "Grilled chicken, rice, broccoli"'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24"
            />
            <Button type="button" disabled={loading || !description.trim()} onClick={handleLog} className="mt-3 w-full">
              <Plus size={14} /> {loading ? "Logging…" : "Log it"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
