"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { lbsToKg, feetInchesToCm } from "@/lib/utils/units";

const SECTIONS = ["Account", "Basic Info", "Training", "Nutrition", "Lifestyle"] as const;

export function OnboardingForm({ token, fullName }: { token: string; fullName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<"METRIC" | "IMPERIAL">("METRIC");
  const [form, setForm] = useState<Record<string, string>>({ fullName });

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    // Convert imperial inputs to canonical metric before sending — the API
    // always stores height_cm / weight_kg regardless of display preference.
    const heightCmValue =
      unit === "IMPERIAL"
        ? form.heightFeet || form.heightInches
          ? feetInchesToCm(Number(form.heightFeet || 0), Number(form.heightInches || 0))
          : undefined
        : form.heightCm
          ? Number(form.heightCm)
          : undefined;
    const currentWeightKgValue =
      unit === "IMPERIAL"
        ? form.currentWeightLbs
          ? lbsToKg(Number(form.currentWeightLbs))
          : undefined
        : form.currentWeightKg
          ? Number(form.currentWeightKg)
          : undefined;
    const goalWeightKgValue =
      unit === "IMPERIAL"
        ? form.goalWeightLbs
          ? lbsToKg(Number(form.goalWeightLbs))
          : undefined
        : form.goalWeightKg
          ? Number(form.goalWeightKg)
          : undefined;

    const payload = {
      email: form.email,
      password: form.password,
      sex: form.sex,
      fullName: form.fullName,
      age: form.age || undefined,
      heightCm: heightCmValue,
      currentWeightKg: currentWeightKgValue,
      goalWeightKg: goalWeightKgValue,
      unitPreference: unit,
      goal: form.goal || undefined,
      daysPerWeek: form.daysPerWeek || undefined,
      workoutDurationMin: form.workoutDurationMin || undefined,
      gymOrHome: form.gymOrHome || undefined,
      experience: form.experience || undefined,
      activityLevel: form.activityLevel || undefined,
      injuries: form.injuries || undefined,
      typicalEatingHabits: form.typicalEatingHabits || undefined,
      foodsEnjoyed: form.foodsEnjoyed || undefined,
      allergies: form.allergies || undefined,
      mealsPerDay: form.mealsPerDay || undefined,
      alcohol: form.alcohol || undefined,
      job: form.job || undefined,
      dailySteps: form.dailySteps || undefined,
      sleepHours: form.sleepHours || undefined,
      motivation: form.motivation || undefined,
    };

    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: { error?: unknown } = {};
      try {
        data = await res.json();
      } catch {
        // Server returned a non-JSON response (e.g. a crash/timeout error
        // page) — fall through to the generic error below instead of
        // leaving the button stuck on "Submitting…" forever.
      }

      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : `Something went wrong (${res.status}). Please try again or contact your coach.`
        );
        return;
      }

      router.push("/login?onboarded=1");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 h-2.5 w-2.5 rounded-full bg-accent" />
        <h1 className="text-lg font-semibold text-foreground">Welcome, {fullName}</h1>
        <p className="mt-1 text-sm text-muted">Let&apos;s set up your coaching profile.</p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-2">
        {SECTIONS.map((s, i) => (
          <div
            key={s}
            className={`h-1 w-10 rounded-full ${i <= step ? "bg-accent" : "bg-surface-2"}`}
          />
        ))}
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-medium text-foreground">{SECTIONS[step]}</h2>

        {step === 0 && (
          <div className="space-y-4">
            <Field label="Email">
              <Input type="email" required value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} />
            </Field>
            <Field label="Create a password">
              <Input type="password" required minLength={8} value={form.password ?? ""} onChange={(e) => update("password", e.target.value)} />
            </Field>
            <Field label="Sex (used to estimate nutrition targets)">
              <Select value={form.sex ?? ""} onChange={(e) => update("sex", e.target.value)}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name" full>
              <Input required value={form.fullName ?? ""} onChange={(e) => update("fullName", e.target.value)} />
            </Field>
            <Field label="Age">
              <Input type="number" value={form.age ?? ""} onChange={(e) => update("age", e.target.value)} />
            </Field>
            <Field label="Units">
              <Select value={unit} onChange={(e) => setUnit(e.target.value as "METRIC" | "IMPERIAL")}>
                <option value="METRIC">Metric (kg / cm)</option>
                <option value="IMPERIAL">Imperial (lb / ft-in)</option>
              </Select>
            </Field>

            {unit === "IMPERIAL" ? (
              <Field label="Height (ft / in)">
                <div className="flex gap-2">
                  <Input type="number" placeholder="ft" value={form.heightFeet ?? ""} onChange={(e) => update("heightFeet", e.target.value)} />
                  <Input type="number" placeholder="in" value={form.heightInches ?? ""} onChange={(e) => update("heightInches", e.target.value)} />
                </div>
              </Field>
            ) : (
              <Field label="Height (cm)">
                <Input type="number" value={form.heightCm ?? ""} onChange={(e) => update("heightCm", e.target.value)} />
              </Field>
            )}

            {unit === "IMPERIAL" ? (
              <Field label="Current weight (lb)">
                <Input type="number" step="0.1" value={form.currentWeightLbs ?? ""} onChange={(e) => update("currentWeightLbs", e.target.value)} />
              </Field>
            ) : (
              <Field label="Current weight (kg)">
                <Input type="number" step="0.1" value={form.currentWeightKg ?? ""} onChange={(e) => update("currentWeightKg", e.target.value)} />
              </Field>
            )}
            {unit === "IMPERIAL" ? (
              <Field label="Goal weight (lb)">
                <Input type="number" step="0.1" value={form.goalWeightLbs ?? ""} onChange={(e) => update("goalWeightLbs", e.target.value)} />
              </Field>
            ) : (
              <Field label="Goal weight (kg)">
                <Input type="number" step="0.1" value={form.goalWeightKg ?? ""} onChange={(e) => update("goalWeightKg", e.target.value)} />
              </Field>
            )}
            <Field label="Main goal" full>
              <Select value={form.goal ?? ""} onChange={(e) => update("goal", e.target.value)}>
                <option value="">Select…</option>
                <option value="FAT_LOSS">Fat loss</option>
                <option value="MUSCLE_GAIN">Muscle gain</option>
                <option value="RECOMP">Recomp</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="GENERAL_HEALTH">General health</option>
              </Select>
            </Field>
            <Field label="Activity level" full>
              <Select value={form.activityLevel ?? ""} onChange={(e) => update("activityLevel", e.target.value)}>
                <option value="">Select…</option>
                <option value="SEDENTARY">Sedentary</option>
                <option value="LIGHTLY_ACTIVE">Lightly active</option>
                <option value="MODERATELY_ACTIVE">Moderately active</option>
                <option value="VERY_ACTIVE">Very active</option>
                <option value="EXTREMELY_ACTIVE">Extremely active</option>
              </Select>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Days per week">
                <Input type="number" value={form.daysPerWeek ?? ""} onChange={(e) => update("daysPerWeek", e.target.value)} />
              </Field>
              <Field label="Workout duration (min)">
                <Input type="number" value={form.workoutDurationMin ?? ""} onChange={(e) => update("workoutDurationMin", e.target.value)} />
              </Field>
              <Field label="Gym or home?">
                <Select value={form.gymOrHome ?? ""} onChange={(e) => update("gymOrHome", e.target.value)}>
                  <option value="">Select…</option>
                  <option value="GYM">Gym</option>
                  <option value="HOME">Home</option>
                  <option value="HYBRID">Both</option>
                </Select>
              </Field>
              <Field label="Experience">
                <Select value={form.experience ?? ""} onChange={(e) => update("experience", e.target.value)}>
                  <option value="">Select…</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </Select>
              </Field>
            </div>
            <Field label="Injuries or limitations">
              <Textarea value={form.injuries ?? ""} onChange={(e) => update("injuries", e.target.value)} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Field label="Typical eating habits">
              <Textarea value={form.typicalEatingHabits ?? ""} onChange={(e) => update("typicalEatingHabits", e.target.value)} />
            </Field>
            <Field label="Foods you enjoy">
              <Textarea value={form.foodsEnjoyed ?? ""} onChange={(e) => update("foodsEnjoyed", e.target.value)} />
            </Field>
            <Field label="Allergies">
              <Input value={form.allergies ?? ""} onChange={(e) => update("allergies", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Meals per day">
                <Input type="number" value={form.mealsPerDay ?? ""} onChange={(e) => update("mealsPerDay", e.target.value)} />
              </Field>
              <Field label="Alcohol">
                <Input value={form.alcohol ?? ""} onChange={(e) => update("alcohol", e.target.value)} placeholder="e.g. 2 drinks/week" />
              </Field>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Field label="Job / occupation">
              <Input value={form.job ?? ""} onChange={(e) => update("job", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Daily steps (avg)">
                <Input type="number" value={form.dailySteps ?? ""} onChange={(e) => update("dailySteps", e.target.value)} />
              </Field>
              <Field label="Sleep (hrs/night)">
                <Input type="number" step="0.5" value={form.sleepHours ?? ""} onChange={(e) => update("sleepHours", e.target.value)} />
              </Field>
            </div>
            <Field label="What's motivating you right now?">
              <Textarea value={form.motivation ?? ""} onChange={(e) => update("motivation", e.target.value)} />
            </Field>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          {step < SECTIONS.length - 1 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button type="button" disabled={loading} onClick={handleSubmit}>
              {loading ? "Submitting…" : "Complete profile"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
