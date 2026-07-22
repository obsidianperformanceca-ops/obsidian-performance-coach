import { NextResponse } from "next/server";
import { requireClient } from "@/lib/auth/session";
import { estimateFromDescription } from "@/lib/calculations/nutrition";

// Separate from POST /api/meals so the client can preview/adjust an
// AI estimate before actually saving the meal (or skip this entirely and
// enter macros by hand).
export async function POST(request: Request) {
  await requireClient();

  const body = await request.json();
  const { description, servingSize } = body as { description?: string; servingSize?: string };

  if (!description || !description.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  const estimate = await estimateFromDescription(description, servingSize);
  return NextResponse.json({ estimate });
}
