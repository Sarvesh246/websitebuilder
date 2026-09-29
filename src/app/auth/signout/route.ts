import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/** POST only (a link or image can't sign someone out). Same-origin check guards against cross-site posts. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const { origin: own } = new URL(request.url);
  if (origin && origin !== own) return new NextResponse(null, { status: 403 });
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Already signed out or not configured: still leave the portal.
  }
  return NextResponse.redirect(`${own}/`, { status: 303 });
}
