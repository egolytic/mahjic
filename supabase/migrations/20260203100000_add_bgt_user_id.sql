-- Add bgt_user_id column for UUID-based identity linking with BGT
-- This enables reliable player matching without email fragility

ALTER TABLE players
ADD COLUMN bgt_user_id uuid UNIQUE;

-- Index for fast lookups
CREATE INDEX idx_players_bgt_user_id
ON players(bgt_user_id) WHERE bgt_user_id IS NOT NULL;

-- Documentation
COMMENT ON COLUMN players.bgt_user_id IS
  'UUID from BGT Supabase auth.users.id - universal player identity for cross-system linking';
