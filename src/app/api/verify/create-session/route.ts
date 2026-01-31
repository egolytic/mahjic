import { createClient } from "@/lib/supabase/server";
import { createVerificationSession } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * POST /api/verify/create-session
 *
 * Creates a Stripe Identity verification session for ID verification.
 * The player must be logged in and own the player profile.
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

    // Check if already verified
    if (player.tier === "verified") {
      return NextResponse.json(
        { error: "You are already verified" },
        { status: 400 }
      );
    }

    // Check for existing pending verification
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe Identity verification session
    const verificationSession = await createVerificationSession({
      playerId,
      userId: user.id,
      returnUrl: `${appUrl}/verify/complete?session_id={CHECKOUT_SESSION_ID}`,
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
    });

  } catch (error) {
    console.error("Create verification session error:", error);
    return NextResponse.json(
      { error: "Failed to create verification session" },
      { status: 500 }
    );
  }
}
