import { createBrowserClient } from "@supabase/ssr";
import { supabasePublicEnv } from "./env";

/**
 * Browser client (publishable key). Nothing in the site uses it yet: the intake form posts to
 * /api/inquiry and the server writes with the secret key. RLS denies every table to browser roles.
 */
export const createClient = () => {
  const env = supabasePublicEnv();
  if (!env) throw new Error("Supabase is not configured");
  return createBrowserClient(env.url, env.key);
};
