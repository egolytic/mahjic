-- Fix RLS policy for players table
-- The original policy incorrectly checked auth.uid() against players.id (the player UUID)
-- It should check against players.auth_user_id (the auth user UUID)

-- Drop the incorrect policy
DROP POLICY IF EXISTS players_select_own ON players;

-- Create the correct policy
CREATE POLICY players_select_own ON players
    FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Also add UPDATE policy so users can update their own profile
DROP POLICY IF EXISTS players_update_own ON players;

CREATE POLICY players_update_own ON players
    FOR UPDATE
    USING (auth.uid() = auth_user_id);
