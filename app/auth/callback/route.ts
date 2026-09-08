import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseSession } from "@/lib/supabase/server";

/** Set by SignInButton before the OAuth hop. See the note there for why. */
const NEXT_COOKIE = "noctra_next";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  const store = await cookies();
  const stored = store.get(NEXT_COOKIE)?.value;

  // Only same-origin paths. The cookie is set by our own code, but it is still
  // client-writable, so treating it as a URL would make this an open redirect.
  let next = "/admin";
  if (stored) {
    const decoded = decodeURIComponent(stored);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) next = decoded;
  }

  const fail = () => {
    const response = NextResponse.redirect(`${origin}/login?error=exchange`);
    response.cookies.set(NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  };

  if (!code) return fail();

  const supabase = await supabaseSession();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return fail();

  const response = NextResponse.redirect(`${origin}${next}`);
  // One hop only -- a stale destination should not outlive the sign-in.
  response.cookies.set(NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
