import { createClient } from "@/lib/supabase/server";
import { createMobileVerificationSession } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * POST /api/verify/mobile-session
 *
 * Creates a Stripe Identity verification session for the mobile SDK.
 * Returns verificationSessionId and ephemeralKeySecret for native mobile verification.
 *
 * Requires:
 * - Authentication via Bearer token
 * - Payment completed first (verification_status = 'paid')
 *
 * Tracks attempts (max 5).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to verify" },
        { status: 401 }
      );
    }

    // Get the player for this user
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: "Player profile not found. Please create a profile first." },
        { status: 404 }
      );
    }

    // Check payment status
    if (player.verification_status === "none" || !player.verification_status) {
      return NextResponse.json(
        { error: "Please complete payment first" },
        { status: 400 }
      );
    }

    // Check if already verified
    if (player.verification_status === "verified" || player.tier === "verified") {
      return NextResponse.json(
        { error: "You are already verified" },
        { status: 400 }
      );
    }

    // Check attempt limit
    const attempts = player.verification_attempts || 0;
    if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return NextResponse.json(
        {
          error: "Maximum verification attempts reached. Please contact support@mahjic.org for manual verification.",
          attemptsUsed: attempts,
          attemptsRemaining: 0,
        },
        { status: 400 }
      );
    }

    // Check for existing pending verification session
    const { data: existingSession } = await supabase
      .from("verification_sessions")
      .select("*")
      .eq("player_id", player.id)
      .eq("status", "pending")
      .single();

    if (existingSession) {
      return NextResponse.json(
        { error: "You already have a pending verification. Please complete it or wait for it to expire." },
        { status: 400 }
      );
    }

    // Increment attempt counter BEFORE creating session (costs $2 per attempt)
    const { error: updateError } = await supabase
      .from("players")
      .update({
        verification_attempts: attempts + 1,
      })
      .eq("id", player.id);

    if (updateError) {
      console.error("Failed to increment verification attempts:", updateError);
      return NextResponse.json(
        { error: "Failed to start verification" },
        { status: 500 }
      );
    }

    // Create Stripe Identity verification session with ephemeral key for mobile
    const { verificationSessionId, ephemeralKeySecret } = await createMobileVerificationSession({
      playerId: player.id,
      userId: user.id,
    });

    // Store verification session in database
    const { error: insertError } = await supabase
      .from("verification_sessions")
      .insert({
        player_id: player.id,
        stripe_session_id: verificationSessionId,
        status: "pending",
      });

    if (insertError) {
      console.error("Failed to store verification session:", insertError);
      // Continue anyway - the verification can still work
    }

    return NextResponse.json({
      verificationSessionId,
      ephemeralKeySecret,
      attemptsUsed: attempts + 1,
      attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - attempts - 1,
    });
  } catch (error) {
    console.error("Create mobile verification session error:", error);
    return NextResponse.json(
      { error: "Failed to create verification session" },
      { status: 500 }
    );
  }
}
