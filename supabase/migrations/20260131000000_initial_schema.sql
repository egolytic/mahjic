-- ============================================================================
-- Mahjic Rating System - Initial Database Schema
-- ============================================================================
--
-- This migration creates the core tables for the Mahjic rating system:
-- - players: Player accounts with ratings and verification status
-- - verified_sources: Clubs/platforms authorized to submit game results
-- - game_sessions: Container for games played at a source on a date
-- - rounds: A group of games played by the same players
-- - round_players: Individual player results within a round
-- - rating_history: Historical tracking of rating changes
--
-- Based on SPEC.md data model.
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- players
-- ----------------------------------------------------------------------------
-- Player accounts in the Mahjic rating system.
--
-- Tiers:
--   - provisional: Created when a Verified Source submits a game (free)
--   - verified: $20/year + Stripe Identity verification, appears on leaderboards
--
-- Privacy modes:
--   - normal: Full participation, public profile
--   - private: Rated and portable, hidden from public search/leaderboards
--   - anonymous: No email, club assigns pseudonym, local to one source only
-- ----------------------------------------------------------------------------
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    tier TEXT NOT NULL DEFAULT 'provisional' CHECK (tier IN ('provisional', 'verified')),
    privacy_mode TEXT NOT NULL DEFAULT 'normal' CHECK (privacy_mode IN ('normal', 'private', 'anonymous')),
    mahjic_rating INTEGER NOT NULL DEFAULT 1500,
    verified_rating INTEGER NOT NULL DEFAULT 1500,
    games_played INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ,
    stripe_customer_id TEXT
);

COMMENT ON TABLE players IS 'Player accounts in the Mahjic rating system';
COMMENT ON COLUMN players.tier IS 'provisional = free account, verified = $20/year + ID check';
COMMENT ON COLUMN players.privacy_mode IS 'normal = public, private = hidden from search/leaderboards, anonymous = local pseudonym';
COMMENT ON COLUMN players.mahjic_rating IS 'Rating based on ALL games played';
COMMENT ON COLUMN players.verified_rating IS 'Rating based only on games vs verified players (used for leaderboards)';
COMMENT ON COLUMN players.verified_at IS 'Timestamp when player completed Stripe Identity verification';
COMMENT ON COLUMN players.stripe_customer_id IS 'Stripe customer ID for payment tracking';


-- ----------------------------------------------------------------------------
-- verified_sources
-- ----------------------------------------------------------------------------
-- Clubs, platforms, or leagues authorized to submit game results.
-- Only games from Verified Sources count toward ratings.
--
-- Onboarding flow:
--   1. Apply at mahjic.org/become-a-source
--   2. Manual review (approved_at = NULL while pending)
--   3. Approved -> receive API key + documentation
-- ----------------------------------------------------------------------------
CREATE TABLE verified_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    contact_email TEXT NOT NULL,
    website TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ
);

COMMENT ON TABLE verified_sources IS 'Clubs/platforms authorized to submit game results';
COMMENT ON COLUMN verified_sources.slug IS 'URL-friendly identifier (e.g., bam-good-time)';
COMMENT ON COLUMN verified_sources.api_key IS 'Hashed API key for authentication';
COMMENT ON COLUMN verified_sources.approved_at IS 'NULL = pending review, set = approved';


-- ----------------------------------------------------------------------------
-- game_sessions
-- ----------------------------------------------------------------------------
-- A session represents games played at a source on a specific date.
-- Contains one or more rounds.
--
-- Game types:
--   - social: Casual club nights, just counting mahjongs (no points)
--   - league: Regular season play with full scoring (points required)
--   - tournament: Competitive events with full scoring (points required)
-- ----------------------------------------------------------------------------
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES verified_sources(id),
    session_date DATE NOT NULL,
    game_type TEXT NOT NULL CHECK (game_type IN ('social', 'league', 'tournament')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE game_sessions IS 'Container for games played at a source on a date';
COMMENT ON COLUMN game_sessions.game_type IS 'social = no points, league/tournament = points required';


-- ----------------------------------------------------------------------------
-- rounds
-- ----------------------------------------------------------------------------
-- A round is a series of games played by the same group of players.
--
-- Validation rule: sum(all mahjongs) + wall_games = games_played
-- ----------------------------------------------------------------------------
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    games_played INTEGER NOT NULL,
    wall_games INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE rounds IS 'A series of games played by the same group of players';
COMMENT ON COLUMN rounds.games_played IS 'Total number of games in this round';
COMMENT ON COLUMN rounds.wall_games IS 'Number of games with no winner (pot exhausted)';


-- ----------------------------------------------------------------------------
-- round_players
-- ----------------------------------------------------------------------------
-- Individual player results within a round.
-- Links players to rounds and tracks their performance.
-- ----------------------------------------------------------------------------
CREATE TABLE round_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id),
    mahjongs INTEGER NOT NULL DEFAULT 0,
    points INTEGER,
    elo_before INTEGER NOT NULL,
    elo_change INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE round_players IS 'Individual player results within a round';
COMMENT ON COLUMN round_players.mahjongs IS 'Number of games won by this player in this round';
COMMENT ON COLUMN round_players.points IS 'Points scored (required for league/tournament, NULL for social)';
COMMENT ON COLUMN round_players.elo_before IS 'Player rating before this round';
COMMENT ON COLUMN round_players.elo_change IS 'Rating change from this round (positive or negative)';


-- ----------------------------------------------------------------------------
-- rating_history
-- ----------------------------------------------------------------------------
-- Historical tracking of rating changes for each player.
-- Enables rating graphs and history viewing.
--
-- Two rating types are tracked:
--   - mahjic: Rating based on all games
--   - verified: Rating based only on games vs verified players
-- ----------------------------------------------------------------------------
CREATE TABLE rating_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    rating_before INTEGER NOT NULL,
    rating_after INTEGER NOT NULL,
    rating_type TEXT NOT NULL CHECK (rating_type IN ('mahjic', 'verified')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE rating_history IS 'Historical tracking of rating changes';
COMMENT ON COLUMN rating_history.rating_type IS 'mahjic = all games, verified = vs verified players only';


-- ============================================================================
-- INDEXES
-- ============================================================================

-- Players table indexes
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_tier ON players(tier);

-- Verified sources table indexes
CREATE INDEX idx_verified_sources_slug ON verified_sources(slug);
CREATE INDEX idx_verified_sources_api_key ON verified_sources(api_key);

-- Game sessions table indexes
CREATE INDEX idx_game_sessions_source_date ON game_sessions(source_id, session_date);

-- Rounds table indexes
CREATE INDEX idx_rounds_session_id ON rounds(session_id);

-- Round players table indexes
CREATE INDEX idx_round_players_round_id ON round_players(round_id);
CREATE INDEX idx_round_players_player_id ON round_players(player_id);

-- Rating history table indexes
CREATE INDEX idx_rating_history_player_created ON rating_history(player_id, created_at);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_history ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Players RLS Policies
-- ----------------------------------------------------------------------------

-- Players can read their own data
CREATE POLICY players_select_own ON players
    FOR SELECT
    USING (auth.uid()::text = id::text);

-- Public can read verified players on leaderboard (normal privacy mode only)
CREATE POLICY players_select_leaderboard ON players
    FOR SELECT
    USING (tier = 'verified' AND privacy_mode = 'normal');

-- Service role can do everything
CREATE POLICY players_service_all ON players
    FOR ALL
    USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Verified Sources RLS Policies
-- ----------------------------------------------------------------------------

-- Public can read approved sources
CREATE POLICY verified_sources_select_approved ON verified_sources
    FOR SELECT
    USING (approved_at IS NOT NULL);

-- Service role can do everything
CREATE POLICY verified_sources_service_all ON verified_sources
    FOR ALL
    USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Game Sessions RLS Policies
-- ----------------------------------------------------------------------------

-- Public can read all game sessions
CREATE POLICY game_sessions_select_all ON game_sessions
    FOR SELECT
    USING (true);

-- Service role can do everything
CREATE POLICY game_sessions_service_all ON game_sessions
    FOR ALL
    USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Rounds RLS Policies
-- ----------------------------------------------------------------------------

-- Public can read all rounds
CREATE POLICY rounds_select_all ON rounds
    FOR SELECT
    USING (true);

-- Service role can do everything
CREATE POLICY rounds_service_all ON rounds
    FOR ALL
    USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Round Players RLS Policies
-- ----------------------------------------------------------------------------

-- Players can read their own round results
CREATE POLICY round_players_select_own ON round_players
    FOR SELECT
    USING (
        player_id IN (
            SELECT id FROM players WHERE auth.uid()::text = id::text
        )
    );

-- Public can read round results for verified players in normal privacy mode
CREATE POLICY round_players_select_public ON round_players
    FOR SELECT
    USING (
        player_id IN (
            SELECT id FROM players
            WHERE tier = 'verified' AND privacy_mode = 'normal'
        )
    );

-- Service role can do everything
CREATE POLICY round_players_service_all ON round_players
    FOR ALL
    USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Rating History RLS Policies
-- ----------------------------------------------------------------------------

-- Players can read their own rating history
CREATE POLICY rating_history_select_own ON rating_history
    FOR SELECT
    USING (
        player_id IN (
            SELECT id FROM players WHERE auth.uid()::text = id::text
        )
    );

-- Public can read rating history for verified players in normal privacy mode
CREATE POLICY rating_history_select_public ON rating_history
    FOR SELECT
    USING (
        player_id IN (
            SELECT id FROM players
            WHERE tier = 'verified' AND privacy_mode = 'normal'
        )
    );

-- Service role can do everything
CREATE POLICY rating_history_service_all ON rating_history
    FOR ALL
    USING (auth.role() = 'service_role');
