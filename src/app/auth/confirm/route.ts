import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Handles email confirmation links from Supabase Auth.
 * This is used for email verification and magic link sign-ins.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const redirect = requestUrl.searchParams.get("redirect") || "/dashboard";
  const origin = requestUrl.origin;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Email confirmed successfully - redirect to intended destination
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // If there's no token or an error occurred, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=email_confirmation_error`);
}
