import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/session";

function toFiniteNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  const { client } = await requireClient();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_meals")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ savedMeals: data ?? [] });
}

// Saves a meal as a reusable template — e.g. a client's daily protein
// shake — so it can be logged again with one tap instead of re-typing or
// re-estimating it every time.
export async function POST(request: Request) {
  const { client } = await requireClient();
  const body = await request.json();
  const { name, description, servingSize, estCalories, estProteinG, estCarbsG, estFatG } = body as {
    name?: string;
    description?: string;
    servingSize?: string;
    estCalories?: unknown;
    estProteinG?: unknown;
    estCarbsG?: unknown;
    estFatG?: unknown;
  };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!description || !description.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_meals")
    .insert({
      client_id: client.id,
      name: name.trim(),
      description: description.trim(),
      serving_size: servingSize?.trim() || null,
      est_calories: toFiniteNumberOrNull(estCalories),
      est_protein_g: toFiniteNumberOrNull(estProteinG),
      est_carbs_g: toFiniteNumberOrNull(estCarbsG),
      est_fat_g: toFiniteNumberOrNull(estFatG),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, savedMeal: data });
}

export async function DELETE(request: Request) {
  await requireClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("saved_meals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
