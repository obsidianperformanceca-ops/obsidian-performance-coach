import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

// Public = reachable without an authenticated session. `/api/onboarding`
// is here because the onboarding "Complete profile" POST is the request
// that CREATES the client's account — there is no session yet at that
// point, and the route authenticates via the invite token in its URL, not
// a cookie. Leaving it out made middleware bounce the submit to /login.
const PUBLIC_PATHS = ["/login", "/onboarding", "/api/onboarding", "/auth", "/api/leads"];

function isPublic(pathname: string) {
  // Exact match only for "/" — the marketing homepage. Using startsWith
  // here would make every route public, so it's handled separately from
  // the prefix-matched paths below.
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    // 303 forces the browser to follow up with a GET. Without this, the
    // default 307 preserves the method, so a POST that gets bounced here
    // would re-POST to /login (a GET-only page) and 405. Belt-and-braces
    // in case any other POST route ever slips past the public-path list.
    return NextResponse.redirect(url, 303);
  }

  // Role-gate the /coach and /client trees. We look up the role via a
  // lightweight query rather than trusting a client-settable cookie.
  if (pathname.startsWith("/coach") || pathname.startsWith("/client")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    );
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    if (pathname.startsWith("/coach") && role !== "COACH") {
      return NextResponse.redirect(new URL("/client/dashboard", request.url));
    }
    if (pathname.startsWith("/client") && role !== "CLIENT") {
      return NextResponse.redirect(new URL("/coach/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
