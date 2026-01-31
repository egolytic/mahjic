/**
 * ELO Rating Calculation for Mahjong
 *
 * In Mahjong, players compete at a table and are compared pairwise.
 * The player with more mahjongs (winning hands) beats those with fewer.
 * ELO changes are summed across all pairwise comparisons.
 */

/**
 * Returns the K-factor based on games played.
 * - New players (< 30 games): K=32 (higher volatility)
 * - Intermediate (30-100 games): K=24
 * - Experienced (> 100 games): K=16 (stable rating)
 */
export function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed < 30) {
    return 32;
  } else if (gamesPlayed <= 100) {
    return 24;
  } else {
    return 16;
  }
}

/**
 * Calculates the expected score against one opponent using the ELO formula.
 * Expected = 1 / (1 + 10^((opponentRating - playerRating) / 400))
 */
export function calculateExpectedScore(
  playerRating: number,
  opponentRating: number
): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Determines the actual score for a pairwise comparison.
 * - 1 if player has more mahjongs (win)
 * - 0.5 if tied
 * - 0 if opponent has more mahjongs (loss)
 */
export function calculateActualScore(
  playerMahjongs: number,
  opponentMahjongs: number
): number {
  if (playerMahjongs > opponentMahjongs) {
    return 1;
  } else if (playerMahjongs === opponentMahjongs) {
    return 0.5;
  } else {
    return 0;
  }
}

interface CalculateEloChangeParams {
  playerRating: number;
  opponentRatings: number[];
  playerMahjongs: number;
  opponentMahjongs: number[];
  kFactor?: number;
}

/**
 * Calculates the total ELO change for a player after a Mahjong game.
 *
 * The player is compared against each opponent at the table.
 * ELO change = K * (actual - expected) for each comparison, summed up.
 *
 * @param playerRating - Current ELO rating of the player
 * @param opponentRatings - Array of opponent ratings
 * @param playerMahjongs - Number of mahjongs (winning hands) the player achieved
 * @param opponentMahjongs - Array of mahjongs each opponent achieved
 * @param kFactor - Optional K-factor override (default derived from games played)
 * @returns The ELO change (can be positive, negative, or zero)
 */
export function calculateEloChange({
  playerRating,
  opponentRatings,
  playerMahjongs,
  opponentMahjongs,
  kFactor = 32,
}: CalculateEloChangeParams): number {
  let totalChange = 0;

  for (let i = 0; i < opponentRatings.length; i++) {
    const expected = calculateExpectedScore(playerRating, opponentRatings[i]);
    const actual = calculateActualScore(playerMahjongs, opponentMahjongs[i]);
    const change = kFactor * (actual - expected);
    totalChange += change;
  }

  // Round to avoid floating point errors
  return Math.round(totalChange * 100) / 100;
}

export interface TablePlayer {
  userId: string;
  rating: number;
  gamesPlayed: number;
  mahjongs: number;
  points?: number; // Optional - only for league/tournament events
}

export interface CalculateTableEloOptions {
  includePointsBonus?: boolean; // true for league/tournament events
}

export interface EloResult {
  userId: string;
  eloBefore: number;
  eloAfter: number;
  eloChange: number;
}

/**
 * Calculates the points bonus for a pairwise comparison.
 * Only applies to league/tournament events.
 *
 * Formula: (your_points - opponent_points) / 50, capped at ±5
 */
export function calculatePointsBonus(
  playerPoints: number,
  opponentPoints: number
): number {
  const differential = playerPoints - opponentPoints;
  const bonus = differential / 50;
  return Math.max(-5, Math.min(5, bonus));
}

/**
 * Calculates ELO changes for all players at a Mahjong table.
 *
 * Each player is compared pairwise against all other players.
 * The player with more mahjongs wins, equal mahjongs is a tie.
 * K-factor varies based on each player's games played.
 *
 * For league/tournament events, a points bonus is added (±5 cap).
 *
 * @param players - Array of players with their ratings, games played, mahjongs, and optionally points
 * @param options - Options including whether to include points bonus
 * @returns Array of ELO results with before/after ratings and change
 */
export function calculateTableEloChanges(
  players: TablePlayer[],
  options: CalculateTableEloOptions = {}
): EloResult[] {
  const { includePointsBonus = false } = options;

  return players.map((player) => {
    // Get opponents (everyone except current player)
    const opponents = players.filter((p) => p.userId !== player.userId);

    // Get K-factor based on player's experience
    const kFactor = getKFactor(player.gamesPlayed);

    let totalChange = 0;

    for (const opponent of opponents) {
      // Calculate base ELO change for this matchup
      const expected = calculateExpectedScore(player.rating, opponent.rating);
      const actual = calculateActualScore(player.mahjongs, opponent.mahjongs);
      let change = kFactor * (actual - expected);

      // Add points bonus if applicable (league/tournament only)
      if (includePointsBonus && player.points !== undefined && opponent.points !== undefined) {
        const bonus = calculatePointsBonus(player.points, opponent.points);
        change += bonus;
      }

      totalChange += change;
    }

    // Round to avoid floating point errors
    const eloChange = Math.round(totalChange * 100) / 100;

    return {
      userId: player.userId,
      eloBefore: player.rating,
      eloAfter: player.rating + eloChange,
      eloChange,
    };
  });
}
