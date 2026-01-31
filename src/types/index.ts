/**
 * Mahjic Rating System - Core Types
 *
 * Types for the open, universal rating system for American Mahjong.
 * Based on SPEC.md data model.
 */

// ============================================================================
// Player Types
// ============================================================================

/**
 * Player verification tier.
 * - provisional: Created when a Verified Source submits a game (free)
 * - verified: $20/year + Stripe Identity verification, appears on leaderboards
 */
export type PlayerTier = 'provisional' | 'verified';

/**
 * Player privacy mode for how their data appears publicly.
 * - normal: Full participation, public profile
 * - private: Rated and portable, hidden from public search/leaderboards
 * - anonymous: No email, club assigns pseudonym, local to one source only
 */
export type PrivacyMode = 'normal' | 'private' | 'anonymous';

/**
 * A player in the Mahjic rating system.
 */
export interface Player {
  /** Unique Mahjic ID */
  id: string;
  /** Player's email address (null for anonymous players) */
  email: string | null;
  /** Display name */
  name: string;
  /** Verification tier */
  tier: PlayerTier;
  /** Privacy mode setting */
  privacyMode: PrivacyMode;
  /** Mahjic Rating - based on all games played */
  mahjicRating: number;
  /** Verified Rating - based only on games vs verified players (used for leaderboards) */
  verifiedRating: number;
  /** Total number of games played */
  gamesPlayed: number;
  /** Account creation timestamp */
  createdAt: Date;
  /** Timestamp when player completed verification (undefined if provisional) */
  verifiedAt?: Date;
}

// ============================================================================
// Verified Source Types
// ============================================================================

/**
 * A Verified Source - club, platform, or league authorized to submit game results.
 */
export interface VerifiedSource {
  /** Unique source identifier */
  id: string;
  /** Display name of the source */
  name: string;
  /** URL-friendly slug (e.g., "bam-good-time", "columbus-mahjong-league") */
  slug: string;
  /** API key for authentication (platforms) */
  apiKey: string;
  /** Primary contact email */
  contactEmail: string;
  /** Website URL (optional) */
  website?: string;
  /** Brief description of the source */
  description?: string;
  /** Account creation timestamp */
  createdAt: Date;
  /** Timestamp when source was approved */
  approvedAt: Date;
}

// ============================================================================
// Game Submission Types
// ============================================================================

/**
 * Type of game being submitted.
 * - social: Casual club nights, just counting mahjongs (no points required)
 * - league: Regular season play with full scoring (points required)
 * - tournament: Competitive events with full scoring (points required)
 */
export type GameType = 'social' | 'league' | 'tournament';

/**
 * A player's results within a single round.
 *
 * Email formats:
 * - "alice@example.com" - normal mode
 * - "PRIVATE:alice@example.com" - private mode
 * - "ANON:Nickname" - anonymous mode
 */
export interface RoundPlayer {
  /** Player email or identifier with optional privacy prefix */
  email: string;
  /** Number of games played in this round (must match other players) */
  gamesPlayed: number;
  /** Number of games won (mahjongs) by this player */
  mahjongs: number;
  /** Total points scored in this round (required for league/tournament, optional for social) */
  points?: number;
}

/**
 * A round of play - same 4 (or 2-3) players playing multiple games together.
 *
 * Validation: sum(all players' mahjongs) + wallGames = gamesPlayed
 */
export interface Round {
  /** Array of 2-4 players in the round */
  players: RoundPlayer[];
  /** Number of games with no winner (pot exhausted) */
  wallGames: number;
}

/**
 * A complete game session submission from a Verified Source.
 */
export interface GameSession {
  /** Unique session identifier */
  id: string;
  /** Verified Source identifier */
  sourceId: string;
  /** Date of play */
  sessionDate: Date;
  /** Type of games played */
  gameType: GameType;
  /** Array of rounds played in this session */
  rounds: Round[];
  /** Timestamp when session was submitted */
  createdAt: Date;
}

// ============================================================================
// ELO Calculation Types
// ============================================================================

/**
 * K-factor thresholds for rating volatility.
 * - < 30 games: K=32 (high volatility, new players adjust quickly)
 * - 30-100 games: K=24 (medium volatility)
 * - > 100 games: K=16 (stable rating, experienced players)
 */
export const K_FACTOR_THRESHOLDS = {
  NEW_PLAYER_GAMES: 30,
  MID_PLAYER_GAMES: 100,
  K_NEW: 32,
  K_MID: 24,
  K_EXPERIENCED: 16,
} as const;

/**
 * Points bonus cap for league/tournament games.
 * Bonus = (player_points - opponent_points) / 50, capped at +/-5
 */
export const POINTS_BONUS_DIVISOR = 50;
export const POINTS_BONUS_CAP = 5;

/**
 * Starting rating for new players.
 */
export const STARTING_RATING = 1500;

/**
 * Result of ELO calculation for a single player.
 */
export interface EloResult {
  /** Player identifier */
  playerId: string;
  /** Previous rating before this calculation */
  previousRating: number;
  /** New rating after this calculation */
  newRating: number;
  /** Rating change (can be positive or negative) */
  ratingChange: number;
  /** K-factor used for this calculation */
  kFactor: number;
}

/**
 * Complete results of processing a round.
 */
export interface RoundResult {
  /** ELO results for each player in the round */
  results: EloResult[];
  /** Whether the round was valid */
  valid: boolean;
  /** Validation error message if invalid */
  error?: string;
}

// ============================================================================
// Rating Scale Reference
// ============================================================================

/**
 * Rating scale descriptions for reference.
 * - 1800+: Expert - Consistently wins against strong competition
 * - 1600-1799: Advanced - Solid fundamentals, reads the card well
 * - 1400-1599: Intermediate - Understands strategy, improving
 * - 1200-1399: Beginner - Learning the game, building skills
 * - <1200: Newcomer - Just getting started
 */
export const RATING_TIERS = {
  EXPERT: { min: 1800, label: 'Expert', description: 'Consistently wins against strong competition' },
  ADVANCED: { min: 1600, max: 1799, label: 'Advanced', description: 'Solid fundamentals, reads the card well' },
  INTERMEDIATE: { min: 1400, max: 1599, label: 'Intermediate', description: 'Understands strategy, improving' },
  BEGINNER: { min: 1200, max: 1399, label: 'Beginner', description: 'Learning the game, building skills' },
  NEWCOMER: { max: 1199, label: 'Newcomer', description: 'Just getting started' },
} as const;

// ============================================================================
// API Types
// ============================================================================

/**
 * API request to submit a game session.
 */
export interface SubmitSessionRequest {
  /** Verified Source identifier */
  sourceId: string;
  /** Date of play (ISO 8601 format) */
  sessionDate: string;
  /** Type of games played */
  gameType: GameType;
  /** Array of rounds played */
  rounds: Round[];
}

/**
 * API response after submitting a game session.
 */
export interface SubmitSessionResponse {
  /** Whether the submission was successful */
  success: boolean;
  /** Created session ID */
  sessionId?: string;
  /** ELO results for all players */
  results?: RoundResult[];
  /** Error message if unsuccessful */
  error?: string;
}

/**
 * Special player email for "Bob" - the imaginary player with fixed 1500 rating.
 */
export const BOB_EMAIL = 'bob@mahjic.org';
