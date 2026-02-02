import { createClient } from "@/lib/supabase/server";
import { createVerificationSession } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * POST /api/verify/start-identity
 *
 * Creates a Stripe Identity verification session.
 * Requires payment to be completed first (verification_status = 'paid').
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

    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    // Verify the player belongs to this user
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .eq("auth_user_id", user.id)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: "Player not found or not owned by you" },
        { status: 404 }
      );
    }

    // Check payment status
    if (player.verification_status === "none") {
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
    if (player.verification_attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return NextResponse.json(
        {
          error: "Maximum verification attempts reached. Please contact support@mahjic.org for manual verification.",
          attemptsUsed: player.verification_attempts,
          maxAttempts: MAX_VERIFICATION_ATTEMPTS,
        },
        { status: 400 }
      );
    }

    // Check for existing pending verification session
    const { data: existingSession } = await supabase
      .from("verification_sessions")
      .select("*")
      .eq("player_id", playerId)
      .eq("status", "pending")
      .single();

    if (existingSession) {
      return NextResponse.json(
        { error: "You already have a pending verification. Please complete it or wait for it to expire." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Increment attempt counter BEFORE creating session (costs $2 per attempt)
    const { error: updateError } = await supabase
      .from("players")
      .update({
        verification_attempts: player.verification_attempts + 1,
      })
      .eq("id", playerId);

    if (updateError) {
      console.error("Failed to increment verification attempts:", updateError);
      return NextResponse.json(
        { error: "Failed to start verification" },
        { status: 500 }
      );
    }

    // Create Stripe Identity verification session
    const verificationSession = await createVerificationSession({
      playerId,
      userId: user.id,
      returnUrl: `${appUrl}/verify?identity=complete`,
    });

    // Store verification session in database
    const { error: insertError } = await supabase
      .from("verification_sessions")
      .insert({
        player_id: playerId,
        stripe_session_id: verificationSession.id,
        status: "pending",
      });

    if (insertError) {
      console.error("Failed to store verification session:", insertError);
      // Continue anyway - the verification can still work
    }

    return NextResponse.json({
      url: verificationSession.url,
      sessionId: verificationSession.id,
      attemptsUsed: player.verification_attempts + 1,
      attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - player.verification_attempts - 1,
    });
  } catch (error) {
    console.error("Create identity verification session error:", error);
    return NextResponse.json(
      { error: "Failed to create verification session" },
      { status: 500 }
    );
  }
}
