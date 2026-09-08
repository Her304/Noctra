"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client. Only the login screen needs one -- it starts the GitHub OAuth
 * redirect and nothing else. Every admin read and write goes through a Server
 * Component or a Server Action, so no privileged call is ever shaped by code
 * the user can edit in devtools.
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
