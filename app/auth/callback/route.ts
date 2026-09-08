import { NextResponse, type NextRequest } from "next/server";
import { supabaseSession } from "@/lib/supabase/server";

/**
 * OAuth landing point. Trades the ?code for a session cookie, then forwards to
 * wherever the sign-in started.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  // Only same-origin paths: `next` arrives from the query string, so treating
  // it as a URL would turn this route into an open redirect.
  const requested = searchParams.get("next") ?? "/admin";
  const next = requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/admin";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=exchange`);
  }

  const supabase = await supabaseSession();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
