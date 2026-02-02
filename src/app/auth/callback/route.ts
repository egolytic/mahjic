import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Handles the OAuth/magic link callback from Supabase Auth.
 * Exchanges the auth code for a session and redirects appropriately.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect = requestUrl.searchParams.get("redirect") || "/dashboard";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", {
        message: error.message,
        status: error.status,
        code: error.code,
        name: error.name,
      });
      // Include error details in redirect for debugging
      return NextResponse.redirect(
        `${origin}/login?error=auth_callback_error&details=${encodeURIComponent(error.message)}`
      );
    }

    if (data?.session) {
      // Successfully authenticated - redirect to intended destination
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // If there's no code, redirect to login with error
  console.error("Auth callback: No code provided");
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error&details=no_code`);
}
