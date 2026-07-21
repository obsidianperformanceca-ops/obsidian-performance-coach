import { NextResponse } from "next/server";
import { requireCoach } from "@/lib/auth/session";
import { generateReminderNotifications } from "@/lib/notifications/generate";

export async function POST() {
  const coach = await requireCoach();
  await generateReminderNotifications(coach.id);
  return NextResponse.json({ success: true });
}
