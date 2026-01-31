-- Verification sessions table for tracking Stripe Identity verifications

CREATE TABLE verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    stripe_session_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'requires_input', 'canceled', 'expired')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_sessions_player_id ON verification_sessions(player_id);
CREATE INDEX idx_verification_sessions_stripe_session_id ON verification_sessions(stripe_session_id);
CREATE INDEX idx_verification_sessions_status ON verification_sessions(status);

-- RLS
ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;

-- Players can view their own verification sessions
CREATE POLICY verification_sessions_select_own ON verification_sessions
    FOR SELECT
    USING (
        player_id IN (
            SELECT id FROM players WHERE auth_user_id = auth.uid()
        )
    );

-- Service role can do everything
CREATE POLICY verification_sessions_service_all ON verification_sessions
    FOR ALL
    USING (auth.role() = 'service_role');

COMMENT ON TABLE verification_sessions IS 'Tracks Stripe Identity verification sessions for player verification';
COMMENT ON COLUMN verification_sessions.status IS 'pending = in progress, verified = passed, requires_input = needs more info, canceled = user canceled, expired = timed out';
