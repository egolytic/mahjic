import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * POST /api/verify/checkout
 *
 * Creates a Stripe Checkout session for the $20 verification fee.
 * Payment must be completed before identity verification.
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
      playerId,
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
