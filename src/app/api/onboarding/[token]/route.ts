import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { onboardingSchema } from "@/lib/validation/schemas";
import { generateStartingTargets } from "@/lib/calculations/targets";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, invite_status, invite_expires_at")
    .eq("invite_token", token)
    .maybeSingle();

  if (!client) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (client.invite_status === "COMPLETED") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }
  if (client.invite_expires_at && new Date(client.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  return NextResponse.json({ fullName: client.full_name });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json();

  const { email, password, sex, ...rest } = body;
  const parsed = onboardingSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("invite_token", token)
    .maybeSingle();

  if (!client) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (client.invite_status === "COMPLETED") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }

  const form = parsed.data;

  // 1. Create the auth user (triggers the public.users row via SQL trigger).
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: form.fullName, role: "CLIENT" },
  });
  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message ?? "Could not create account" }, { status: 400 });
  }

  // 2. Generate a starting-point set of nutrition targets.
  const targets =
    form.currentWeightKg && form.heightCm && form.age && form.activityLevel && form.goal
      ? generateStartingTargets({
          weightKg: form.currentWeightKg,
          heightCm: form.heightCm,
          age: form.age,
          sex: sex === "female" ? "female" : "male",
          activityLevel: form.activityLevel,
          goal: form.goal,
        })
      : null;

  // 3. Fill in the client profile.
  const { error: updateError } = await supabase
    .from("clients")
    .update({
      user_id: authUser.user.id,
      full_name: form.fullName,
      age: form.age,
      height_cm: form.heightCm,
      starting_weight_kg: form.currentWeightKg,
      current_weight_kg: form.currentWeightKg,
      goal_weight_kg: form.goalWeightKg,
      goal: form.goal,
      activity_level: form.activityLevel,
      experience_level: form.experience,
      training_location: form.gymOrHome,
      injuries: form.injuries,
      invite_status: "COMPLETED",
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", client.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // 4. Store the raw questionnaire answers.
  await supabase.from("onboarding_responses").insert({
    client_id: client.id,
    days_per_week: form.daysPerWeek,
    workout_duration_min: form.workoutDurationMin,
    gym_or_home: form.gymOrHome,
    experience: form.experience,
    injuries: form.injuries,
    typical_eating_habits: form.typicalEatingHabits,
    foods_enjoyed: form.foodsEnjoyed,
    allergies: form.allergies,
    meals_per_day: form.mealsPerDay,
    alcohol: form.alcohol,
    job: form.job,
    daily_steps: form.dailySteps,
    sleep_hours: form.sleepHours,
    motivation: form.motivation,
  });

  // 5. Seed initial weight entry + targets.
  if (form.currentWeightKg) {
    await supabase.from("weights").insert({ client_id: client.id, weight_kg: form.currentWeightKg });
  }
  if (targets) {
    await supabase.from("targets").insert({
      client_id: client.id,
      calories: targets.calories,
      protein_g: targets.proteinG,
      carbs_g: targets.carbsG,
      fat_g: targets.fatG,
      water_ml: targets.waterMl,
      is_active: true,
    });
  }

  return NextResponse.json({ success: true });
}
