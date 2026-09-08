import { NextResponse, type NextRequest } from "next/server";
import { supabaseSession } from "@/lib/supabase/server";

/**
 * POST-only: a sign-out reachable by GET can be triggered by any image tag or
 * link on another site.
 */
export async function POST(request: NextRequest) {
  const supabase = await supabaseSession();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), {
    status: 303,
  });
}
