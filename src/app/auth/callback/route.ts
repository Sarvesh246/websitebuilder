import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth/next";
import { createClient } from "@/utils/supabase/server";

/** OAuth and email-confirmation return point: exchanges the one-time code for a session cookie. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    } catch {
      // fall through to the error redirect
    }
  }
  return NextResponse.redirect(`${origin}/login?error=callback`);
}
