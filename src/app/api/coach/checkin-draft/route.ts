import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth/session";
import { getClientById } from "@/lib/db/clients";
import { getWeightsForClient } from "@/lib/db/weights";
import { getDailyLogsForClient } from "@/lib/db/daily-logs";
import { weeklyWeightChange } from "@/lib/calculations/progress";

// Drafts a weekly check-in message from the last ~14 days of data. The
// coach reviews/edits before anything is sent — this only returns text,
// it never messages the client directly.
export async function POST(request: Request) {
  await requireCoach();

  const { clientId } = (await request.json()) as { clientId?: string };
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI drafting isn't configured — add ANTHROPIC_API_KEY to enable it." },
      { status: 503 }
    );
  }

  const client = await getClientById(clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const [weights, logs] = await Promise.all([
    getWeightsForClient(clientId),
    getDailyLogsForClient(clientId, 14),
  ]);

  const weightChange = weeklyWeightChange(
    weights.map((w) => ({ weightKg: w.weight_kg, recordedAt: w.recorded_at }))
  );

  const loggedDays = logs.filter((l) => l.status !== "PENDING").length;
  const workoutDays = logs.filter((l) => l.workout_completed).length;
  const hunger = avg(logs.map((l) => l.hunger_level).filter((v): v is number => v != null));
  const energy = avg(logs.map((l) => l.energy_level).filter((v): v is number => v != null));

  // Compact, already-summarized snapshot — cheaper and more reliable than
  // dumping raw rows, and avoids leaking more client data than needed.
  const snapshot = {
    name: client.full_name,
    goal: client.goal,
    weightTrendKgPerWeek: weightChange,
    daysLoggedLast14: loggedDays,
    workoutsLast14: workoutDays,
    avgHunger1to10: hunger,
    avgEnergy1to10: energy,
  };

  const supabase = await createClient();
  const { data: notes } = await supabase
    .from("coach_notes")
    .select("body")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(3);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content:
              `You are helping a fitness/nutrition coach write a warm, personal weekly check-in message to their client. ` +
              `Write in the first person as the coach, directly to the client, 4-7 sentences. Be encouraging but honest, ` +
              `reference the specific numbers, and end with one clear focus for the coming week. Do not invent data not present. ` +
              `Output only the message text, no preamble.\n\n` +
              `Client data (last 14 days):\n${JSON.stringify(snapshot, null, 2)}\n\n` +
              `Recent private coach notes for context (do not quote directly):\n${(notes ?? []).map((n) => `- ${n.body}`).join("\n") || "none"}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "AI request failed — try again." }, { status: 502 });
    }
    const data = await res.json();
    const draft: string = data?.content?.[0]?.text?.trim() ?? "";
    if (!draft) return NextResponse.json({ error: "Empty draft — try again." }, { status: 502 });

    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json({ error: "AI request failed — try again." }, { status: 502 });
  }
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}
