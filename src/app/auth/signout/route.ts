import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/** POST only (a link or image can't sign someone out). Same-origin check guards against cross-site posts. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const { origin: own } = new URL(request.url);
  if (origin && origin !== own) return new NextResponse(null, { status: 403 });
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Already signed out or not configured: still leave the portal.
  }
  // A provider outage must not leave this browser signed in after it says "Sign out".
  const jar = await cookies();
  for (const cookie of jar.getAll()) {
    if (/^sb-.+-auth-token(?:\.\d+|-code-verifier)?$/.test(cookie.name) || cookie.name === "nf-view-as")
      jar.delete(cookie.name);
  }
  const response = NextResponse.redirect(`${own}/`, { status: 303 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
