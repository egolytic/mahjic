-- Additional tables for auth and applications

-- Claim tokens for provisional players to claim their accounts
CREATE TABLE claim_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_claim_tokens_token ON claim_tokens(token);
CREATE INDEX idx_claim_tokens_player_id ON claim_tokens(player_id);

-- Add auth_user_id to players for linking Supabase Auth
ALTER TABLE players ADD COLUMN IF NOT EXISTS auth_user_id UUID;
CREATE INDEX IF NOT EXISTS idx_players_auth_user_id ON players(auth_user_id);

-- Source applications (pending review)
CREATE TABLE source_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    contact_email TEXT NOT NULL,
    website TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID
);

CREATE INDEX idx_source_applications_status ON source_applications(status);

-- RLS for claim_tokens
ALTER TABLE claim_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY claim_tokens_service_all ON claim_tokens
    FOR ALL
    USING (auth.role() = 'service_role');

-- RLS for source_applications  
ALTER TABLE source_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY source_applications_service_all ON source_applications
    FOR ALL
    USING (auth.role() = 'service_role');

COMMENT ON TABLE claim_tokens IS 'Tokens for provisional players to claim their accounts';
COMMENT ON TABLE source_applications IS 'Pending applications from clubs wanting to become Verified Sources';
