"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  X,
  Trash2,
  Coffee,
  Sandwich,
  UtensilsCrossed,
  Cookie,
  GlassWater,
  Sparkles,
  Bookmark,
  Zap,
} from "lucide-react";
import type { MealRow } from "@/lib/db/daily-logs";
import type { SavedMealRow } from "@/lib/db/saved-meals";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "DRINK";

const MEAL_META: { type: MealType; label: string; icon: typeof Coffee }[] = [
  { type: "BREAKFAST", label: "Breakfast", icon: Coffee },
  { type: "LUNCH", label: "Lunch", icon: Sandwich },
  { type: "DINNER", label: "Dinner", icon: UtensilsCrossed },
  { type: "SNACK", label: "Snack", icon: Cookie },
  { type: "DRINK", label: "Drink", icon: GlassWater },
];

type Macros = { calories: string; proteinG: string; carbsG: string; fatG: string };
const EMPTY_MACROS: Macros = { calories: "", proteinG: "", carbsG: "", fatG: "" };

export function MealQuickLog({
  todayMeals,
  savedMeals,
}: {
  todayMeals: MealRow[];
  savedMeals: SavedMealRow[];
}) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<MealType | null>(null);
  const [description, setDescription] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [macros, setMacros] = useState<Macros>(EMPTY_MACROS);
  const [estimating, setEstimating] = useState(false);
  const [estimateNote, setEstimateNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickAddingId, setQuickAddingId] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  function resetModal() {
    setDescription("");
    setServingSize("");
    setMacros(EMPTY_MACROS);
    setEstimateNote(null);
    setActiveType(null);
    setSaveAsTemplate(false);
    setTemplateName("");
  }

  async function handleEstimate() {
    if (!description.trim()) return;
    setEstimating(true);
    setEstimateNote(null);
    try {
      const res = await fetch("/api/meals/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, servingSize }),
      });
      const data = await res.json();
      const est = data?.estimate as { calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null } | undefined;

      if (est && est.calories != null) {
        setMacros({
          calories: String(est.calories),
          proteinG: est.proteinG != null ? String(est.proteinG) : "",
          carbsG: est.carbsG != null ? String(est.carbsG) : "",
          fatG: est.fatG != null ? String(est.fatG) : "",
        });
      } else {
        setEstimateNote("Couldn't get an AI estimate — enter the numbers yourself below.");
      }
    } catch {
      setEstimateNote("Couldn't get an AI estimate — enter the numbers yourself below.");
    } finally {
      setEstimating(false);
    }
  }

  async function handleLog() {
    if (!activeType || !description.trim()) return;
    setLoading(true);
    await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: activeType,
        description,
        servingSize,
        estCalories: macros.calories,
        estProteinG: macros.proteinG,
        estCarbsG: macros.carbsG,
        estFatG: macros.fatG,
      }),
    });

    if (saveAsTemplate && templateName.trim()) {
      await fetch("/api/saved-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          description,
          servingSize,
          estCalories: macros.calories,
          estProteinG: macros.proteinG,
          estCarbsG: macros.carbsG,
          estFatG: macros.fatG,
        }),
      });
    }

    setLoading(false);
    resetModal();
    router.refresh();
  }

  // One-tap logging from a saved meal (e.g. "My protein shake") — no
  // re-typing or re-estimating, it just logs the saved template as-is.
  async function handleQuickAdd(saved: SavedMealRow) {
    if (!activeType) return;
    setQuickAddingId(saved.id);
    await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: activeType,
        description: saved.description,
        servingSize: saved.serving_size ?? "",
        estCalories: saved.est_calories,
        estProteinG: saved.est_protein_g,
        estCarbsG: saved.est_carbs_g,
        estFatG: saved.est_fat_g,
      }),
    });
    setQuickAddingId(null);
    resetModal();
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleDeleteSaved(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/saved-meals?id=${id}`, { method: "DELETE" });
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
        Tap a meal when you eat it, describe what you had, and get an AI estimate of the calories/macros — or type
        your own. Your remaining calories for the day update right away.
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
                        <span className="text-foreground">
                          {entry.description}
                          {entry.serving_size && <span className="text-subtle"> · {entry.serving_size}</span>}
                        </span>
                        <div className="flex items-center gap-3">
                          {entry.est_calories != null && (
                            <span className="text-xs text-subtle">{entry.est_calories} kcal</span>
                          )}
                          <button type="button" onClick={() => handleDelete(entry.id)} className="text-subtle hover:text-danger">
                            <Trash2 size={14} />
                          </button>
                        </div>
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
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Log {MEAL_META.find((m) => m.type === activeType)?.label}
              </h3>
              <button type="button" onClick={resetModal} className="text-subtle hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            {savedMeals.length > 0 && (
              <div className="mb-4">
                <Label>Your saved meals</Label>
                <div className="mt-1 space-y-1.5">
                  {savedMeals.map((saved) => (
                    <button
                      key={saved.id}
                      type="button"
                      disabled={quickAddingId !== null}
                      onClick={() => handleQuickAdd(saved)}
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-sm transition-colors hover:border-accent disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2 text-foreground">
                        <Zap size={13} className="shrink-0 text-accent" />
                        {saved.name}
                        {saved.est_calories != null && (
                          <span className="text-xs text-subtle">{saved.est_calories} kcal</span>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        {quickAddingId === saved.id && <span className="text-xs text-subtle">Logging…</span>}
                        <Trash2
                          size={13}
                          className="shrink-0 text-subtle hover:text-danger"
                          onClick={(e) => handleDeleteSaved(saved.id, e)}
                        />
                      </span>
                    </button>
                  ))}
                </div>
                <div className="my-4 border-t border-border" />
                <Label>Or log something new</Label>
              </div>
            )}

            <Label>What did you eat?</Label>
            <Textarea
              autoFocus
              placeholder='e.g. "Grilled chicken, rice, broccoli"'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20"
            />

            <div className="mt-3">
              <Label>Serving size (optional)</Label>
              <Input
                placeholder='e.g. "6 oz chicken, 1 cup rice"'
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              disabled={!description.trim() || estimating}
              onClick={handleEstimate}
              className="mt-3 w-full"
            >
              <Sparkles size={14} /> {estimating ? "Estimating…" : "Estimate with AI"}
            </Button>
            {estimateNote && <p className="mt-2 text-xs text-subtle">{estimateNote}</p>}

            <div className="mt-3 grid grid-cols-4 gap-2">
              <div>
                <Label>Cal</Label>
                <Input type="number" value={macros.calories} onChange={(e) => setMacros((m) => ({ ...m, calories: e.target.value }))} />
              </div>
              <div>
                <Label>Protein</Label>
                <Input type="number" value={macros.proteinG} onChange={(e) => setMacros((m) => ({ ...m, proteinG: e.target.value }))} />
              </div>
              <div>
                <Label>Carbs</Label>
                <Input type="number" value={macros.carbsG} onChange={(e) => setMacros((m) => ({ ...m, carbsG: e.target.value }))} />
              </div>
              <div>
                <Label>Fat</Label>
                <Input type="number" value={macros.fatG} onChange={(e) => setMacros((m) => ({ ...m, fatG: e.target.value }))} />
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Bookmark size={14} className="text-subtle" /> Save this as a quick-add meal
            </label>
            {saveAsTemplate && (
              <Input
                className="mt-2"
                placeholder='Name it, e.g. "My protein shake"'
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            )}

            <Button
              type="button"
              disabled={loading || !description.trim() || (saveAsTemplate && !templateName.trim())}
              onClick={handleLog}
              className="mt-3 w-full"
            >
              <Plus size={14} /> {loading ? "Logging…" : "Log it"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
