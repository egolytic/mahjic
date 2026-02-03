import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/players/me
 *
 * Returns the current authenticated user's player profile.
 * Used by the mobile app to check verification status.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Get the player for this user
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, display_name, email, rating, tier, verification_status, verification_attempts")
      .eq("auth_user_id", user.id)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: "Player profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: player.id,
      name: player.display_name,
      email: player.email,
      rating: player.rating || 1200,
      tier: player.tier || "provisional",
      verification_status: player.verification_status || "none",
      verification_attempts: player.verification_attempts || 0,
    });
  } catch (error) {
    console.error("Get player error:", error);
    return NextResponse.json(
      { error: "Failed to get player profile" },
      { status: 500 }
    );
  }
}
