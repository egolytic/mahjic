/**
 * GET /api/v1/leaderboard
 *
 * Get the global leaderboard.
 * Returns verified players sorted by verified_rating.
 * Only includes players with tier='verified' and privacy_mode='normal'.
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/auth";

interface LeaderboardEntry {
  rank: number;
  mahjic_id: string;
  display_name: string | null;
  verified_rating: number;
  games_played: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  total: number;
  limit: number;
  offset: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");
  const minGames = parseInt(searchParams.get("min_games") || "10");

  const supabase = createAdminClient();

  // Query verified players in normal privacy mode
  const { data: players, error, count } = await supabase
    .from("players")
    .select("id, name, verified_rating, games_played", { count: "exact" })
    .eq("tier", "verified")
    .eq("privacy_mode", "normal")
    .gte("games_played", minGames)
    .order("verified_rating", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to fetch leaderboard:", error);
    return apiError("database_error", "Failed to fetch leaderboard", 500);
  }

  // Transform the data with ranks
  const leaderboard: LeaderboardEntry[] = (players || []).map((player, index) => ({
    rank: offset + index + 1,
    mahjic_id: player.id,
    display_name: player.name,
    verified_rating: player.verified_rating,
    games_played: player.games_played,
  }));

  const response: LeaderboardResponse = {
    leaderboard,
    total: count || 0,
    limit,
    offset,
  };

  return apiSuccess(response);
}
