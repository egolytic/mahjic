/**
 * GET /api/v1/players/[id]/history
 *
 * Get player's game history with ELO changes.
 * Supports pagination with limit/offset.
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/auth";

interface HistoryEntry {
  date: string;
  round_id: string;
  source_name: string;
  game_type: string;
  games_played: number;
  mahjongs: number;
  points: number | null;
  rating_before: number;
  rating_after: number;
  rating_change: number;
}

interface HistoryResponse {
  mahjic_id: string;
  history: HistoryEntry[];
  total: number;
  limit: number;
  offset: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return apiError("invalid_request", "Player ID is required", 400);
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = createAdminClient();

  // First check if player exists and is accessible
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, privacy_mode")
    .eq("id", id)
    .single();

  if (playerError || !player) {
    return apiError("player_not_found", `No player exists with ID ${id}`, 404);
  }

  // Check privacy settings
  if (player.privacy_mode === "private" || player.privacy_mode === "anonymous") {
    return apiError("player_not_found", `No player exists with ID ${id}`, 404);
  }

  // Build the query for round_players with related data
  let query = supabase
    .from("round_players")
    .select(`
      id,
      mahjongs,
      points,
      elo_before,
      elo_change,
      created_at,
      round:rounds (
        id,
        games_played,
        session:game_sessions (
          session_date,
          game_type,
          source:verified_sources (
            name
          )
        )
      )
    `, { count: "exact" })
    .eq("player_id", id)
    .order("created_at", { ascending: false });

  // Apply date filters if provided
  if (from) {
    query = query.gte("created_at", `${from}T00:00:00Z`);
  }
  if (to) {
    query = query.lte("created_at", `${to}T23:59:59Z`);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: roundPlayers, error: historyError, count } = await query;

  if (historyError) {
    console.error("Failed to fetch history:", historyError);
    return apiError("database_error", "Failed to fetch player history", 500);
  }

  // Transform the data - Supabase returns nested relations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const history: HistoryEntry[] = (roundPlayers || []).map((rp: any) => {
    // Handle Supabase nested relation format
    const round = rp.round;
    const session = round?.session;
    const source = session?.source;

    return {
      date: session?.session_date || "",
      round_id: round?.id || "",
      source_name: source?.name || "",
      game_type: session?.game_type || "",
      games_played: round?.games_played || 0,
      mahjongs: rp.mahjongs,
      points: rp.points,
      rating_before: rp.elo_before,
      rating_after: rp.elo_before + rp.elo_change,
      rating_change: rp.elo_change,
    };
  });

  const response: HistoryResponse = {
    mahjic_id: id,
    history,
    total: count || 0,
    limit,
    offset,
  };

  return apiSuccess(response);
}
