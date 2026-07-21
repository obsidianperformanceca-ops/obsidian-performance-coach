import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { sendMessage } from "@/lib/db/messages";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, body } = await request.json();
  if (!clientId || !body?.trim()) {
    return NextResponse.json({ error: "clientId and body are required" }, { status: 400 });
  }

  await sendMessage(clientId, user.id, user.role, body.trim());
  return NextResponse.json({ success: true });
}
