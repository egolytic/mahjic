/**
 * GET /api/v1/players/[id]
 *
 * Get player profile by Mahjic ID.
 * Respects privacy_mode settings.
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/auth";

interface PlayerResponse {
  mahjic_id: string;
  display_name: string | null;
  rating: number;
  verified_rating: number;
  games_played: number;
  tier: string;
  is_private: boolean;
  joined_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return apiError("invalid_request", "Player ID is required", 400);
  }

  const supabase = createAdminClient();

  const { data: player, error } = await supabase
    .from("players")
    .select("id, name, mahjic_rating, verified_rating, games_played, tier, privacy_mode, created_at")
    .eq("id", id)
    .single();

  if (error || !player) {
    return apiError("player_not_found", `No player exists with ID ${id}`, 404);
  }

  // Check privacy settings
  if (player.privacy_mode === "private" || player.privacy_mode === "anonymous") {
    return apiError("player_not_found", `No player exists with ID ${id}`, 404);
  }

  const response: PlayerResponse = {
    mahjic_id: player.id,
    display_name: player.name,
    rating: player.mahjic_rating,
    verified_rating: player.verified_rating,
    games_played: player.games_played,
    tier: player.tier,
    is_private: false,
    joined_at: player.created_at.split("T")[0], // Return just the date portion
  };

  return apiSuccess(response);
}
