import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/players/me
 *
 * Returns the current authenticated user's player profile.
 * Used by the mobile app to check verification status.
 *
 * If the user doesn't have a player profile, one is auto-created
 * as a free provisional profile with default ratings.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createAdminClient();

  // Try to fetch existing player
  const { data: player, error: fetchError } = await adminSupabase
    .from("players")
    .select("id, name, email, mahjic_rating, verified_rating, games_played, tier, privacy_mode, verified_at, stripe_customer_id, stripe_subscription_id, subscription_status, verification_status, verification_attempts")
    .eq("auth_user_id", user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 = no rows found (expected for new users)
    console.error("Error fetching player:", fetchError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // If player exists, return it
  if (player) {
    return NextResponse.json({
      id: player.id,
      name: player.name,
      display_name: player.name,
      email: player.email,
      rating: player.mahjic_rating,
      mahjic_rating: player.mahjic_rating,
      verified_rating: player.verified_rating,
      games_played: player.games_played,
      tier: player.tier,
      privacy_mode: player.privacy_mode,
      verification_status: player.verification_status || (player.subscription_status === "active" ? "verified" : "none"),
      verification_attempts: player.verification_attempts || 0,
      verified_at: player.verified_at,
      stripe_customer_id: player.stripe_customer_id,
      subscription_status: player.subscription_status,
    });
  }

  // Auto-create free provisional profile for new users
  const playerName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Player";

  const { data: newPlayer, error: createError } = await adminSupabase
    .from("players")
    .insert({
      name: playerName,
      email: user.email,
      auth_user_id: user.id,
      tier: "provisional",
      privacy_mode: "normal",
      mahjic_rating: 1500,
      verified_rating: 1500,
      games_played: 0,
      subscription_status: "none",
      verification_status: "none",
      verification_attempts: 0,
    })
    .select("id, name, email, mahjic_rating, verified_rating, games_played, tier, privacy_mode")
    .single();

  if (createError) {
    console.error("Failed to create player:", createError);
    return NextResponse.json(
      { error: "Failed to create player profile" },
      { status: 500 }
    );
  }

  console.log(`Auto-created player profile for ${user.email} (auth_user_id: ${user.id})`);

  return NextResponse.json({
    id: newPlayer.id,
    name: newPlayer.name,
    display_name: newPlayer.name,
    email: newPlayer.email,
    rating: newPlayer.mahjic_rating,
    mahjic_rating: newPlayer.mahjic_rating,
    verified_rating: newPlayer.verified_rating,
    games_played: newPlayer.games_played,
    tier: newPlayer.tier,
    privacy_mode: newPlayer.privacy_mode,
    verification_status: "none",
    verification_attempts: 0,
    verified_at: null,
    stripe_customer_id: null,
    subscription_status: "none",
  });
}
