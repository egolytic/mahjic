/**
 * API Validation Utilities
 *
 * Validation functions for game session submissions.
 */

import { GameType } from "@/types";

/**
 * API input for a player within a round (snake_case to match API spec).
 */
export interface RoundPlayerInput {
  bgt_user_id?: string; // Primary identifier from BGT (UUID)
  email: string;        // Required for display/fallback
  games_played: number;
  mahjongs: number;
  points?: number;
}

export interface RoundInput {
  players: RoundPlayerInput[];
  wall_games: number;
}

export interface SessionInput {
  session_date: string;
  game_type: GameType;
  rounds: RoundInput[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a session submission request.
 */
export function validateSessionInput(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== "object") {
    return {
      valid: false,
      errors: [{ field: "body", message: "Request body must be a JSON object" }],
    };
  }

  const data = input as Record<string, unknown>;

  // Validate session_date
  if (!data.session_date) {
    errors.push({ field: "session_date", message: "session_date is required" });
  } else if (typeof data.session_date !== "string") {
    errors.push({ field: "session_date", message: "session_date must be a string" });
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.session_date)) {
    errors.push({
      field: "session_date",
      message: "session_date must be in ISO format (YYYY-MM-DD)",
    });
  }

  // Validate game_type
  const validGameTypes = ["social", "league", "tournament"];
  if (!data.game_type) {
    errors.push({ field: "game_type", message: "game_type is required" });
  } else if (!validGameTypes.includes(data.game_type as string)) {
    errors.push({
      field: "game_type",
      message: `game_type must be one of: ${validGameTypes.join(", ")}`,
    });
  }

  // Validate rounds
  if (!data.rounds) {
    errors.push({ field: "rounds", message: "rounds is required" });
  } else if (!Array.isArray(data.rounds)) {
    errors.push({ field: "rounds", message: "rounds must be an array" });
  } else if (data.rounds.length === 0) {
    errors.push({ field: "rounds", message: "rounds must contain at least one round" });
  } else {
    // Validate each round
    (data.rounds as unknown[]).forEach((round, roundIndex) => {
      const roundErrors = validateRound(
        round,
        roundIndex,
        data.game_type as string
      );
      errors.push(...roundErrors);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a single round.
 */
function validateRound(
  round: unknown,
  index: number,
  gameType: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `rounds[${index}]`;

  if (!round || typeof round !== "object") {
    errors.push({ field: prefix, message: "Round must be an object" });
    return errors;
  }

  const r = round as Record<string, unknown>;

  // Validate players array
  if (!r.players) {
    errors.push({ field: `${prefix}.players`, message: "players is required" });
    return errors;
  }

  if (!Array.isArray(r.players)) {
    errors.push({ field: `${prefix}.players`, message: "players must be an array" });
    return errors;
  }

  if (r.players.length < 2 || r.players.length > 4) {
    errors.push({
      field: `${prefix}.players`,
      message: "Each round must have 2-4 players",
    });
  }

  // Validate wall_games
  if (r.wall_games === undefined || r.wall_games === null) {
    errors.push({ field: `${prefix}.wall_games`, message: "wall_games is required" });
  } else if (typeof r.wall_games !== "number" || r.wall_games < 0) {
    errors.push({
      field: `${prefix}.wall_games`,
      message: "wall_games must be a non-negative number",
    });
  }

  // Validate each player
  const players = r.players as unknown[];
  let totalMahjongs = 0;
  let gamesPlayed: number | null = null;

  players.forEach((player, playerIndex) => {
    const playerErrors = validateRoundPlayer(
      player,
      `${prefix}.players[${playerIndex}]`,
      gameType
    );
    errors.push(...playerErrors);

    if (player && typeof player === "object") {
      const p = player as Record<string, unknown>;
      if (typeof p.mahjongs === "number") {
        totalMahjongs += p.mahjongs;
      }
      if (typeof p.games_played === "number") {
        if (gamesPlayed === null) {
          gamesPlayed = p.games_played;
        } else if (gamesPlayed !== p.games_played) {
          errors.push({
            field: `${prefix}`,
            message: "All players in a round must have the same games_played value",
          });
        }
      }
    }
  });

  // Validate the mahjong sum rule: sum(mahjongs) + wall_games = games_played
  if (
    gamesPlayed !== null &&
    typeof r.wall_games === "number" &&
    errors.length === 0
  ) {
    const expectedGamesPlayed = totalMahjongs + r.wall_games;
    if (expectedGamesPlayed !== gamesPlayed) {
      errors.push({
        field: prefix,
        message: `Invalid round data: sum of mahjongs (${totalMahjongs}) + wall_games (${r.wall_games}) must equal games_played (${gamesPlayed})`,
      });
    }
  }

  return errors;
}

/**
 * Validates a single player within a round.
 */
function validateRoundPlayer(
  player: unknown,
  field: string,
  gameType: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!player || typeof player !== "object") {
    errors.push({ field, message: "Player must be an object" });
    return errors;
  }

  const p = player as Record<string, unknown>;

  // Validate bgt_user_id (optional, but must be valid UUID if provided)
  if (p.bgt_user_id !== undefined && p.bgt_user_id !== null) {
    if (typeof p.bgt_user_id !== "string") {
      errors.push({ field: `${field}.bgt_user_id`, message: "bgt_user_id must be a string" });
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.bgt_user_id)) {
      errors.push({ field: `${field}.bgt_user_id`, message: "bgt_user_id must be a valid UUID" });
    }
  }

  // Validate email
  if (!p.email) {
    errors.push({ field: `${field}.email`, message: "email is required" });
  } else if (typeof p.email !== "string") {
    errors.push({ field: `${field}.email`, message: "email must be a string" });
  }

  // Validate games_played
  if (p.games_played === undefined || p.games_played === null) {
    errors.push({ field: `${field}.games_played`, message: "games_played is required" });
  } else if (typeof p.games_played !== "number" || p.games_played < 1) {
    errors.push({
      field: `${field}.games_played`,
      message: "games_played must be a positive number",
    });
  }

  // Validate mahjongs
  if (p.mahjongs === undefined || p.mahjongs === null) {
    errors.push({ field: `${field}.mahjongs`, message: "mahjongs is required" });
  } else if (typeof p.mahjongs !== "number" || p.mahjongs < 0) {
    errors.push({
      field: `${field}.mahjongs`,
      message: "mahjongs must be a non-negative number",
    });
  }

  // Validate points (required for league/tournament)
  if (gameType === "league" || gameType === "tournament") {
    if (p.points === undefined || p.points === null) {
      errors.push({
        field: `${field}.points`,
        message: "points is required for league/tournament games",
      });
    } else if (typeof p.points !== "number") {
      errors.push({ field: `${field}.points`, message: "points must be a number" });
    }
  }

  return errors;
}

/**
 * Parses an email with privacy prefix.
 * Returns the actual email and privacy mode.
 */
export function parsePlayerEmail(email: string): {
  email: string;
  privacyMode: "normal" | "private" | "anonymous";
  isAnonymous: boolean;
} {
  if (email.startsWith("PRIVATE:")) {
    return {
      email: email.slice(8), // Remove "PRIVATE:" prefix
      privacyMode: "private",
      isAnonymous: false,
    };
  }

  if (email.startsWith("ANON:")) {
    return {
      email: email, // Keep the full ANON:Nickname as identifier
      privacyMode: "anonymous",
      isAnonymous: true,
    };
  }

  return {
    email,
    privacyMode: "normal",
    isAnonymous: false,
  };
}
