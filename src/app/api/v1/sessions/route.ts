/**
 * POST /api/v1/sessions
 *
 * Submit game results from a Verified Source.
 * Creates/finds players, calculates ELO changes, and stores the session.
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import {
  validateSessionInput,
  parsePlayerEmail,
  SessionInput,
  RoundInput,
} from "@/lib/api/validation";
import {
  calculateTableEloChanges,
  TablePlayer,
} from "@/lib/elo";
import { BOB_EMAIL, STARTING_RATING } from "@/types";

interface PlayerResult {
  mahjic_id: string;
  bgt_user_id: string | null;
  email: string;
  is_new_player: boolean;
  rating_before: number;
  rating_after: number;
  rating_change: number;
  verified_rating_before: number;
  verified_rating_after: number;
  verified_rating_change: number;
  games_played_total: number;
}

export async function POST(request: NextRequest) {
  // Validate API key
  const authResult = await validateApiKey(request);
  if (!authResult.success) {
    return apiError("invalid_api_key", authResult.error, authResult.status);
  }

  const source = authResult.source;

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", "Request body must be valid JSON", 400);
  }

  // Validate input
  const validation = validateSessionInput(body);
  if (!validation.valid) {
    return apiError(
      "invalid_session",
      `Validation failed: ${validation.errors.map((e) => e.message).join("; ")}`,
      400
    );
  }

  const input = body as SessionInput;
  const supabase = createAdminClient();

  // Create the game session
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .insert({
      source_id: source.id,
      session_date: input.session_date,
      game_type: input.game_type,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error("Failed to create session:", sessionError);
    return apiError("database_error", "Failed to create session", 500);
  }

  const allResults: PlayerResult[] = [];
  const includePointsBonus = input.game_type === "league" || input.game_type === "tournament";

  // Process each round
  for (const roundInput of input.rounds) {
    const roundResults = await processRound(
      supabase,
      session.id,
      roundInput,
      source.id,
      includePointsBonus
    );

    if (roundResults.error) {
      // Rollback: delete the session (cascades to rounds)
      await supabase.from("game_sessions").delete().eq("id", session.id);
      return apiError("processing_error", roundResults.error, 500);
    }

    allResults.push(...roundResults.results);
  }

  // Deduplicate results (same player might appear in multiple rounds)
  const playerResultMap = new Map<string, PlayerResult>();
  for (const result of allResults) {
    const existing = playerResultMap.get(result.mahjic_id);
    if (existing) {
      // Accumulate changes across rounds
      existing.rating_after = result.rating_after;
      existing.rating_change += result.rating_change;
      existing.verified_rating_after = result.verified_rating_after;
      existing.verified_rating_change += result.verified_rating_change;
      existing.games_played_total = result.games_played_total;
    } else {
      playerResultMap.set(result.mahjic_id, { ...result });
    }
  }

  return apiSuccess({
    session_id: session.id,
    results: Array.from(playerResultMap.values()),
  }, 201);
}

interface ProcessRoundResult {
  results: PlayerResult[];
  error?: string;
}

async function processRound(
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
  roundInput: RoundInput,
  sourceId: string,
  includePointsBonus: boolean
): Promise<ProcessRoundResult> {
  const gamesPlayed = roundInput.players[0].games_played;

  // Create the round record
  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .insert({
      session_id: sessionId,
      games_played: gamesPlayed,
      wall_games: roundInput.wall_games,
    })
    .select("id")
    .single();

  if (roundError || !round) {
    console.error("Failed to create round:", roundError);
    return { results: [], error: "Failed to create round" };
  }

  // Get or create players
  const playersData: Array<{
    id: string;
    bgtUserId: string | null;
    email: string;
    mahjicRating: number;
    verifiedRating: number;
    gamesPlayed: number;
    tier: string;
    privacyMode: string;
    isNew: boolean;
    mahjongs: number;
    points?: number;
  }> = [];

  for (const playerInput of roundInput.players) {
    const parsed = parsePlayerEmail(playerInput.email);

    // Special handling for Bob (imaginary player)
    if (parsed.email === BOB_EMAIL) {
      playersData.push({
        id: "bob",
        bgtUserId: null,
        email: BOB_EMAIL,
        mahjicRating: STARTING_RATING,
        verifiedRating: STARTING_RATING,
        gamesPlayed: 0,
        tier: "verified",
        privacyMode: "normal",
        isNew: false,
        mahjongs: playerInput.mahjongs,
        points: playerInput.points,
      });
      continue;
    }

    // Get bgt_user_id from input (if provided)
    const bgtUserId = playerInput.bgt_user_id;

    let player: {
      id: string;
      email: string;
      mahjic_rating: number;
      verified_rating: number;
      games_played: number;
      tier: string;
      privacy_mode: string;
      bgt_user_id?: string | null;
    } | null = null;
    let isNew = false;

    // 1. Try lookup by bgt_user_id first (if provided)
    if (bgtUserId) {
      const { data: byUuid } = await supabase
        .from("players")
        .select("id, email, mahjic_rating, verified_rating, games_played, tier, privacy_mode, bgt_user_id")
        .eq("bgt_user_id", bgtUserId)
        .single();

      if (byUuid) {
        player = byUuid;
      }
    }

    // 2. Try lookup by email (if not found by UUID)
    if (!player) {
      const { data: byEmail } = await supabase
        .from("players")
        .select("id, email, mahjic_rating, verified_rating, games_played, tier, privacy_mode, bgt_user_id")
        .eq("email", parsed.email)
        .single();

      if (byEmail) {
        // Auto-link: If we have bgt_user_id but player found by email doesn't have it, link them
        if (bgtUserId && !byEmail.bgt_user_id) {
          const { data: updated } = await supabase
            .from("players")
            .update({ bgt_user_id: bgtUserId })
            .eq("id", byEmail.id)
            .select("id, email, mahjic_rating, verified_rating, games_played, tier, privacy_mode, bgt_user_id")
            .single();

          console.log(`Auto-linked player ${byEmail.email} to bgt_user_id ${bgtUserId}`);
          player = updated || byEmail;
        } else {
          player = byEmail;
        }
      }
    }

    // 3. Create new player if not found
    if (!player) {
      const newPlayerData: Record<string, unknown> = {
        email: parsed.email,
        name: parsed.isAnonymous ? parsed.email.slice(5) : null, // Use nickname for anonymous
        tier: "provisional",
        privacy_mode: parsed.privacyMode,
        mahjic_rating: STARTING_RATING,
        verified_rating: STARTING_RATING,
        games_played: 0,
      };

      // Include bgt_user_id if provided
      if (bgtUserId) {
        newPlayerData.bgt_user_id = bgtUserId;
      }

      const { data: newPlayer, error: createError } = await supabase
        .from("players")
        .insert(newPlayerData)
        .select("id, email, mahjic_rating, verified_rating, games_played, tier, privacy_mode, bgt_user_id")
        .single();

      if (createError || !newPlayer) {
        console.error("Failed to create player:", createError);
        return { results: [], error: `Failed to create player: ${parsed.email}` };
      }

      player = newPlayer;
      isNew = true;
    }

    playersData.push({
      id: player.id,
      bgtUserId: player.bgt_user_id || null,
      email: player.email,
      mahjicRating: player.mahjic_rating,
      verifiedRating: player.verified_rating,
      gamesPlayed: player.games_played,
      tier: player.tier,
      privacyMode: player.privacy_mode,
      isNew,
      mahjongs: playerInput.mahjongs,
      points: playerInput.points,
    });
  }

  // Calculate ELO changes for Mahjic Rating (all players)
  const tablePlayersForMahjic: TablePlayer[] = playersData.map((p) => ({
    userId: p.id,
    rating: p.mahjicRating,
    gamesPlayed: p.gamesPlayed,
    mahjongs: p.mahjongs,
    points: p.points,
  }));

  const mahjicEloResults = calculateTableEloChanges(tablePlayersForMahjic, {
    includePointsBonus,
  });

  // Calculate ELO changes for Verified Rating (only vs verified players)
  const verifiedPlayers = playersData.filter((p) => p.tier === "verified");
  let verifiedEloResults: ReturnType<typeof calculateTableEloChanges> = [];

  if (verifiedPlayers.length >= 2) {
    const tablePlayersForVerified: TablePlayer[] = verifiedPlayers.map((p) => ({
      userId: p.id,
      rating: p.verifiedRating,
      gamesPlayed: p.gamesPlayed,
      mahjongs: p.mahjongs,
      points: p.points,
    }));

    verifiedEloResults = calculateTableEloChanges(tablePlayersForVerified, {
      includePointsBonus,
    });
  }

  // Update players and create round_players records
  const results: PlayerResult[] = [];

  for (const playerData of playersData) {
    // Skip Bob - don't update or track
    if (playerData.id === "bob") {
      results.push({
        mahjic_id: "bob",
        bgt_user_id: null,
        email: BOB_EMAIL,
        is_new_player: false,
        rating_before: STARTING_RATING,
        rating_after: STARTING_RATING,
        rating_change: 0,
        verified_rating_before: STARTING_RATING,
        verified_rating_after: STARTING_RATING,
        verified_rating_change: 0,
        games_played_total: 0,
      });
      continue;
    }

    const mahjicResult = mahjicEloResults.find((r) => r.userId === playerData.id);
    const verifiedResult = verifiedEloResults.find((r) => r.userId === playerData.id);

    const mahjicChange = mahjicResult?.eloChange ?? 0;
    const verifiedChange = verifiedResult?.eloChange ?? 0;

    const newMahjicRating = Math.round(playerData.mahjicRating + mahjicChange);
    const newVerifiedRating = Math.round(playerData.verifiedRating + verifiedChange);
    const newGamesPlayed = playerData.gamesPlayed + gamesPlayed;

    // Update player ratings
    const { error: updateError } = await supabase
      .from("players")
      .update({
        mahjic_rating: newMahjicRating,
        verified_rating: newVerifiedRating,
        games_played: newGamesPlayed,
      })
      .eq("id", playerData.id);

    if (updateError) {
      console.error("Failed to update player:", updateError);
      return { results: [], error: `Failed to update player: ${playerData.email}` };
    }

    // Create round_player record
    const { error: roundPlayerError } = await supabase
      .from("round_players")
      .insert({
        round_id: round.id,
        player_id: playerData.id,
        mahjongs: playerData.mahjongs,
        points: playerData.points,
        elo_before: playerData.mahjicRating,
        elo_change: Math.round(mahjicChange),
      });

    if (roundPlayerError) {
      console.error("Failed to create round_player:", roundPlayerError);
      return { results: [], error: "Failed to create round_player record" };
    }

    // Create rating_history records
    const historyRecords = [
      {
        player_id: playerData.id,
        round_id: round.id,
        rating_before: playerData.mahjicRating,
        rating_after: newMahjicRating,
        rating_type: "mahjic",
      },
    ];

    if (verifiedResult) {
      historyRecords.push({
        player_id: playerData.id,
        round_id: round.id,
        rating_before: playerData.verifiedRating,
        rating_after: newVerifiedRating,
        rating_type: "verified",
      });
    }

    const { error: historyError } = await supabase
      .from("rating_history")
      .insert(historyRecords);

    if (historyError) {
      console.error("Failed to create rating_history:", historyError);
      // Non-fatal - continue
    }

    results.push({
      mahjic_id: playerData.id,
      bgt_user_id: playerData.bgtUserId,
      email: playerData.email,
      is_new_player: playerData.isNew,
      rating_before: playerData.mahjicRating,
      rating_after: newMahjicRating,
      rating_change: Math.round(mahjicChange),
      verified_rating_before: playerData.verifiedRating,
      verified_rating_after: newVerifiedRating,
      verified_rating_change: Math.round(verifiedChange),
      games_played_total: newGamesPlayed,
    });
  }

  return { results };
}
