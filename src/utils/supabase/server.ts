import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabasePublicEnv } from "./env";

/**
 * Request-scoped client acting as the visitor (publishable key + auth cookies), for future
 * Supabase Auth. It has the same rights as the browser, so it cannot touch project_requests.
 */
export const createClient = async () => {
  const env = supabasePublicEnv();
  if (!env) throw new Error("Supabase is not configured");
  const cookieStore = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. Harmless without auth.
        }
      },
    },
  });
};

/**
 * Trusted server client (SUPABASE_SERVICE_ROLE_KEY, bypasses RLS). Server-only, never
 * NEXT_PUBLIC_. Returns null when not configured so callers can fail with a clean 503.
 */
export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(10_000) }) },
  });
};
