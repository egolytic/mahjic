-- Safe migration to add verification payment columns (idempotent)
-- This migration is safe to run multiple times

-- Add verification_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'players' AND column_name = 'verification_status'
    ) THEN
        ALTER TABLE players ADD COLUMN verification_status TEXT DEFAULT 'none';
        ALTER TABLE players ADD CONSTRAINT players_verification_status_check
            CHECK (verification_status IN ('none', 'paid', 'verified'));
    END IF;
END $$;

-- Add verification_paid_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'players' AND column_name = 'verification_paid_at'
    ) THEN
        ALTER TABLE players ADD COLUMN verification_paid_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add verification_attempts column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'players' AND column_name = 'verification_attempts'
    ) THEN
        ALTER TABLE players ADD COLUMN verification_attempts INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add verification_checkout_session_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'players' AND column_name = 'verification_checkout_session_id'
    ) THEN
        ALTER TABLE players ADD COLUMN verification_checkout_session_id TEXT;
    END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_players_verification_status ON players(verification_status);

-- Migrate existing verified players
UPDATE players
SET verification_status = 'verified'
WHERE tier = 'verified' AND (verification_status IS NULL OR verification_status = 'none');

-- Set default for any remaining null values
UPDATE players
SET verification_status = 'none'
WHERE verification_status IS NULL;

-- Add comments
COMMENT ON COLUMN players.verification_status IS 'none = not paid, paid = awaiting identity verification, verified = complete';
COMMENT ON COLUMN players.verification_paid_at IS 'Timestamp when $20 verification fee was paid';
COMMENT ON COLUMN players.verification_attempts IS 'Number of Stripe Identity verification attempts (max 5)';
COMMENT ON COLUMN players.verification_checkout_session_id IS 'Stripe Checkout session ID for refund calculations';
