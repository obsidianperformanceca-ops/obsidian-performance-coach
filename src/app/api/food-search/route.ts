import { NextResponse } from "next/server";
import { requireClient } from "@/lib/auth/session";
import { mapOffProduct, OFF_USER_AGENT, type FoodSearchResult, type OffProduct } from "@/lib/food/open-food-facts";

// Proxied server-side so the browser isn't calling a third-party API
// directly (CORS + keeps our options open to swap providers later).
export async function GET(request: Request) {
  await requireClient();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "q is required" }, { status: 400 });

  try {
    const url =
      "https://world.openfoodfacts.org/cgi/search.pl?json=1&action=process&page_size=10" +
      "&fields=product_name,brands,serving_size,nutriments" +
      `&search_terms=${encodeURIComponent(q)}`;

    const res = await fetch(url, {
      headers: { "User-Agent": OFF_USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = (await res.json()) as { products?: OffProduct[] };
    const results = (data.products ?? [])
      .map(mapOffProduct)
      .filter((r): r is FoodSearchResult => r !== null)
      .slice(0, 8);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
