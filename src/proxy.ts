import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the Supabase session fresh (rotates auth cookies) and sends signed-out visitors away from
 * /portal. This is a convenience gate: every portal page and action ALSO verifies the user and role
 * server-side, so bypassing the proxy never grants access.
 */
export async function proxy(request: NextRequest) {
  const demo = process.env.PORTAL_DEMO === "1" && process.env.NODE_ENV !== "production";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (demo || !url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  if (!signedIn && request.nextUrl.pathname.startsWith("/portal")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  // Everything except static assets and image routes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|opengraph-image|images/|.*\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml)$).*)"],
};
