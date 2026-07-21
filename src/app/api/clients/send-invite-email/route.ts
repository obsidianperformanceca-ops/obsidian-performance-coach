import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth/session";
import { isEmailConfigured, sendOnboardingInviteEmail } from "@/lib/email/resend";

export async function POST(request: Request) {
  const coach = await requireCoach();

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email sending isn't set up yet — add RESEND_API_KEY to enable this." },
      { status: 501 }
    );
  }

  const body = await request.json();
  const { clientId, email } = body as { clientId?: string; email?: string };
  if (!clientId || !email) {
    return NextResponse.json({ error: "clientId and email are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("full_name, invite_token, coach_id")
    .eq("id", clientId)
    .single();

  if (!client || !client.invite_token) {
    return NextResponse.json({ error: "Client or invite not found" }, { status: 404 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const inviteUrl = `${origin}/onboarding/${client.invite_token}`;

  const result = await sendOnboardingInviteEmail({
    to: email,
    clientName: client.full_name,
    coachName: coach.full_name ?? coach.email,
    inviteUrl,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Could not send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
