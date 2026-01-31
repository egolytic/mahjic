import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * API route to claim a player profile.
 * Links a provisional player account to an authenticated user.
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
        { error: "You must be logged in to claim a profile" },
        { status: 401 }
      );
    }

    const { token, playerId } = await request.json();

    if (!token || !playerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the claim token
    const { data: claimData, error: claimError } = await supabase
      .from("claim_tokens")
      .select("*")
      .eq("token", token)
      .eq("player_id", playerId)
      .single();

    if (claimError || !claimData) {
      return NextResponse.json(
        { error: "Invalid claim token" },
        { status: 400 }
      );
    }

    // Check if already claimed
    if (claimData.claimed_at) {
      return NextResponse.json(
        { error: "This profile has already been claimed" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(claimData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This claim link has expired" },
        { status: 400 }
      );
    }

    // Check if user already has a linked player
    const { data: existingPlayer } = await supabase
      .from("players")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (existingPlayer) {
      return NextResponse.json(
        { error: "You already have a linked player profile" },
        { status: 400 }
      );
    }

    // Link the player to the auth user
    const { error: updateError } = await supabase
      .from("players")
      .update({
        auth_user_id: user.id,
        email: user.email,
      })
      .eq("id", playerId);

    if (updateError) {
      console.error("Error linking player:", updateError);
      return NextResponse.json(
        { error: "Failed to claim profile" },
        { status: 500 }
      );
    }

    // Mark the claim token as used
    await supabase
      .from("claim_tokens")
      .update({ claimed_at: new Date().toISOString() })
      .eq("id", claimData.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Claim profile error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
