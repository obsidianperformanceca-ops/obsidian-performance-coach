import { NextResponse } from "next/server";
import { requireClient } from "@/lib/auth/session";
import { estimateFromDescription, estimateFromImage } from "@/lib/calculations/nutrition";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Client downscales before upload; this is just a hard backstop so nobody
// posts an 8MB original straight to the API route.
const MAX_IMAGE_BASE64_LENGTH = 4_000_000; // ~3MB decoded

// Separate from POST /api/meals so the client can preview/adjust an
// AI estimate before actually saving the meal (or skip this entirely and
// enter macros by hand). Accepts either a text description or a photo.
export async function POST(request: Request) {
  await requireClient();

  const body = await request.json();
  const { description, servingSize, imageBase64, imageMediaType } = body as {
    description?: string;
    servingSize?: string;
    imageBase64?: string;
    imageMediaType?: string;
  };

  if (imageBase64) {
    if (!imageMediaType || !ALLOWED_IMAGE_TYPES.includes(imageMediaType)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }
    if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      return NextResponse.json({ error: "Image too large" }, { status: 400 });
    }
    const estimate = await estimateFromImage(imageBase64, imageMediaType, description);
    return NextResponse.json({ estimate });
  }

  if (!description || !description.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  const estimate = await estimateFromDescription(description, servingSize);
  return NextResponse.json({ estimate });
}
