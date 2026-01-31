import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * API route to create a Stripe Identity verification session.
 *
 * TODO: Implement Stripe Identity integration
 * 1. Create a Stripe Identity VerificationSession
 * 2. Store session ID in database linked to player
 * 3. Return client_secret for frontend to open verification modal
 *
 * Stripe Identity docs: https://docs.stripe.com/identity
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

    // TODO: Create Stripe Identity verification session
    // Example implementation:
    //
    // import Stripe from 'stripe';
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    //
    // const verificationSession = await stripe.identity.verificationSessions.create({
    //   type: 'document',
    //   metadata: {
    //     player_id: playerId,
    //     user_id: user.id,
    //   },
    //   options: {
    //     document: {
    //       allowed_types: ['driving_license', 'passport', 'id_card'],
    //       require_id_number: false,
    //       require_live_capture: true,
    //       require_matching_selfie: true,
    //     },
    //   },
    //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/complete`,
    // });
    //
    // // Store verification session in database
    // await supabase.from('verification_sessions').insert({
    //   player_id: playerId,
    //   stripe_session_id: verificationSession.id,
    //   status: 'pending',
    // });
    //
    // return NextResponse.json({
    //   url: verificationSession.url,
    //   client_secret: verificationSession.client_secret,
    // });

    // Placeholder response until Stripe is integrated
    return NextResponse.json({
      error: "Stripe Identity integration not yet implemented. Add STRIPE_SECRET_KEY to .env.local",
      // Uncomment below once Stripe is configured:
      // url: verificationSession.url,
    }, { status: 501 });

  } catch (error) {
    console.error("Create verification session error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
