import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function credentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return { url, key };
}

/**
 * Public read client. Session-less on purpose: the marketing and briefing pages
 * are prerendered and revalidated on a timer, so binding them to a visitor's
 * cookies would make them uncacheable for no gain. Every table is
 * public-SELECT under RLS, and since 20260907000001_role_grants.sql the anon
 * role no longer holds INSERT, UPDATE, DELETE or TRUNCATE at all -- the policy
 * is now the second lock rather than the only one.
 */
export function supabase() {
  const { url, key } = credentials();
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Session-aware client for the admin surface. Reads the signed-in user from
 * cookies so PostgREST runs statements as `authenticated`, which is what the
 * is_admin() policies key off.
 *
 * The anon key is still the API key here. Authority comes from the user's JWT,
 * not the key -- there is no elevated key anywhere in the web app, so a leaked
 * bundle grants exactly what a logged-out visitor already has.
 */
export async function supabaseSession() {
  const { url, key } = credentials();
  const store = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        // Server Components cannot mutate cookies. Refresh happens in proxy.ts,
        // which can, so swallowing this is correct rather than a silent bug.
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          /* called from a Server Component -- see above */
        }
      },
    },
  });
}

/**
 * The signed-in user, or null. Uses getUser() rather than getSession(): the
 * session comes straight from a cookie the client controls, while getUser()
 * revalidates it against the auth server. For a gate, that difference matters.
 */
export async function currentUser() {
  const {
    data: { user },
  } = await (await supabaseSession()).auth.getUser();
  return user;
}
