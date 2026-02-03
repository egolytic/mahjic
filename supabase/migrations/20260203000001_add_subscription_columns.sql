-- Migration to add subscription tracking columns (idempotent)
-- Supports yearly subscription model for verification

-- Add stripe_subscription_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'players' AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE players ADD COLUMN stripe_subscription_id TEXT;
    END IF;
END $$;

-- Add subscription_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'players' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE players ADD COLUMN subscription_status TEXT DEFAULT 'none';
        ALTER TABLE players ADD CONSTRAINT players_subscription_status_check
            CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled', 'unpaid'));
    END IF;
END $$;

-- Create index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_players_stripe_subscription_id ON players(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_players_subscription_status ON players(subscription_status);

-- Add comments
COMMENT ON COLUMN players.stripe_subscription_id IS 'Stripe subscription ID for yearly verification';
COMMENT ON COLUMN players.subscription_status IS 'none = no subscription, active = current, past_due = payment failed, canceled = ended';
