import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every /admin request and bounces
 * signed-out visitors to /login.
 *
 * This is convenience, not security. Next.js middleware has been bypassable in
 * the past (CVE-2025-29927), so nothing here is the only thing standing between
 * a request and the data: app/admin/layout.tsx re-checks the user server-side,
 * and the RLS policies re-check is_admin() in the database. Strip this file out
 * entirely and the admin surface is still closed -- you would just get an ugly
 * error instead of a redirect.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Must be getUser(), not getSession(): this call is what actually refreshes
  // an expiring token, and it validates against the auth server rather than
  // trusting the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    // So the round trip lands back where the admin was headed.
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
