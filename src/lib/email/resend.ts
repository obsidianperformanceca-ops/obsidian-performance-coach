import { Resend } from "resend";

/**
 * Email sending is optional — the app works fully via copy-link/copy-SMS
 * without it. Set RESEND_API_KEY (and optionally RESEND_FROM_EMAIL, which
 * must be on a domain verified in your Resend account) to enable the
 * "Send email" option on the invite modal.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendOnboardingInviteEmail({
  to,
  clientName,
  coachName,
  inviteUrl,
}: {
  to: string;
  clientName: string;
  coachName: string;
  inviteUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getClient();
    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: `${coachName} <${from}>`,
      to,
      subject: `${coachName} invited you to Obsidian Performance Coach`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <p>Hi ${clientName},</p>
          <p>${coachName} has set up your coaching profile. Click below to create your account and complete your onboarding questionnaire:</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background:#4f7cff;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
              Set up your account
            </a>
          </p>
          <p style="color:#888;font-size:12px;">This link expires in 14 days. If the button doesn't work, copy this URL: ${inviteUrl}</p>
        </div>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not send email" };
  }
}

/**
 * Sends a notification email (to LEAD_NOTIFICATION_EMAIL) when a prospect
 * submits the public "Book a Consultation" form on the marketing homepage.
 * Requires both RESEND_API_KEY and LEAD_NOTIFICATION_EMAIL to be set.
 */
export async function sendLeadNotificationEmail({
  name,
  email,
  phone,
  goals,
}: {
  name: string;
  email: string;
  phone?: string;
  goals: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const notifyTo = process.env.LEAD_NOTIFICATION_EMAIL;
    if (!notifyTo) throw new Error("LEAD_NOTIFICATION_EMAIL is not set");

    const resend = getClient();
    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: `Obsidian Website <${from}>`,
      to: notifyTo,
      replyTo: email,
      subject: `New consultation request — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "—"}</p>
          <p><strong>Goals:</strong></p>
          <p style="white-space: pre-wrap;">${goals}</p>
        </div>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not send email" };
  }
}
