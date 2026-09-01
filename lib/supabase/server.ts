import { createClient } from "@supabase/supabase-js";

/**
 * Server-side read client. Uses the anon key deliberately: every table is
 * public-SELECT under RLS, and the service role key must never be reachable
 * from the web app.
 */
export function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
