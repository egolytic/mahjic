import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckoutSession } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * POST /api/verify/checkout
 *
 * Creates a Stripe Checkout session for the $20 verification fee.
 * Payment must be completed before identity verification.
 *
 * If the user doesn't have a player profile yet, one will be created.
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

    const { playerId, userEmail } = await request.json();

    let player;

    if (playerId) {
      // Verify the existing player belongs to this user
      const { data: existingPlayer, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId)
        .eq("auth_user_id", user.id)
        .single();

      if (playerError || !existingPlayer) {
        return NextResponse.json(
          { error: "Player not found or not owned by you" },
          { status: 404 }
        );
      }

      player = existingPlayer;
    } else {
      // No playerId provided - check if user already has a player profile
      // Use admin client to bypass RLS (the RLS policy checks wrong column)
      const adminSupabase = createAdminClient();
      const { data: existingPlayer } = await adminSupabase
        .from("players")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (existingPlayer) {
        player = existingPlayer;
      } else {
        // Create a new player profile for this user
        const playerName = user.user_metadata?.full_name
          || user.email?.split("@")[0]
          || "Player";

        const { data: newPlayer, error: createError } = await adminSupabase
          .from("players")
          .insert({
            name: playerName,
            email: user.email || userEmail,
            auth_user_id: user.id,
            tier: "provisional",
            mahjic_rating: 1500,
            verified_rating: 1500,
            games_played: 0,
            verification_status: "none",
            verification_attempts: 0,
          })
          .select()
          .single();

        if (createError || !newPlayer) {
          console.error("Failed to create player:", createError);
          return NextResponse.json(
            { error: "Failed to create player profile" },
            { status: 500 }
          );
        }

        player = newPlayer;
      }
    }

    // Check if already paid or verified
    if (player.verification_status === "paid") {
      return NextResponse.json(
        { error: "You have already paid. Please complete identity verification." },
        { status: 400 }
      );
    }

    if (player.verification_status === "verified" || player.tier === "verified") {
      return NextResponse.json(
        { error: "You are already verified" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Stripe Checkout session for $20 payment
    const checkoutSession = await createCheckoutSession({
      playerId: player.id,
      userId: user.id,
      customerEmail: user.email || player.email,
      successUrl: `${appUrl}/verify?payment=success`,
      cancelUrl: `${appUrl}/verify?payment=canceled`,
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Create checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
