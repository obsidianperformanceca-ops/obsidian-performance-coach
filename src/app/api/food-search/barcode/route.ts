import { NextResponse } from "next/server";
import { requireClient } from "@/lib/auth/session";
import { mapOffProduct, OFF_USER_AGENT, type OffProduct } from "@/lib/food/open-food-facts";

// Barcode → product lookup via Open Food Facts. The scanner runs in the
// browser (camera); this route just resolves the scanned digits.
export async function GET(request: Request) {
  await requireClient();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.replace(/\D/g, "");
  if (!code || code.length < 6) {
    return NextResponse.json({ error: "Valid barcode required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,serving_size,nutriments`,
      {
        headers: { "User-Agent": OFF_USER_AGENT },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return NextResponse.json({ result: null });

    const data = (await res.json()) as { status?: number; product?: OffProduct };
    if (!data.product) return NextResponse.json({ result: null });

    return NextResponse.json({ result: mapOffProduct(data.product) });
  } catch {
    return NextResponse.json({ result: null });
  }
}
