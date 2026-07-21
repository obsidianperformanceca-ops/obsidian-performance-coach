import { NextResponse } from "next/server";
import { isEmailConfigured, sendLeadNotificationEmail } from "@/lib/email/resend";
import { leadSchema } from "@/lib/validation/schemas";

/**
 * Public lead-capture endpoint for the marketing homepage's "Book a
 * Consultation" form. Deliberately unauthenticated (see the PUBLIC_PATHS
 * allowlist in src/middleware.ts) — prospective clients don't have accounts.
 *
 * This is NOT the client onboarding flow (src/app/api/onboarding/[token]).
 * That route only runs after the coach has manually added a client and sent
 * them an invite link from the coach dashboard. There is no public
 * self-serve account signup in this app by design.
 */
export async function POST(request: Request) {
  if (!isEmailConfigured() || !process.env.LEAD_NOTIFICATION_EMAIL) {
    return NextResponse.json(
      {
        error:
          "Consultation request email isn't set up yet — add RESEND_API_KEY and LEAD_NOTIFICATION_EMAIL to enable this.",
      },
      { status: 501 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fill in your name, email, and goals." },
      { status: 400 }
    );
  }

  const result = await sendLeadNotificationEmail(parsed.data);
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Could not send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
