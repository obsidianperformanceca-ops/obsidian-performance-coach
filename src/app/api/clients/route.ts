import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth/session";
import { newClientSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const coach = await requireCoach();
  const body = await request.json();
  const parsed = newClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const inviteToken = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      coach_id: coach.id,
      full_name: parsed.data.fullName,
      invite_token: inviteToken,
      invite_status: "PENDING",
      invite_expires_at: expiresAt,
      status: "ACTIVE",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Stash the invite email alongside for the onboarding step to pre-fill —
  // stored client-side isn't ideal, so we keep it in onboarding_responses-free
  // form by returning it directly; the coach shares the link manually.
  return NextResponse.json({
    client: data,
    inviteUrl: `/onboarding/${inviteToken}`,
    email: parsed.data.email,
  });
}
