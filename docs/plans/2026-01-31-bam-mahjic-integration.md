# BAM Good Time → Mahjic Integration Plan

## Overview

Integrate BAM Good Time with Mahjic so that when scores are submitted in BAM, they're also sent to Mahjic for the universal rating system.

**Goal:** Every finalized game in BAM Good Time automatically updates players' Mahjic ratings.

---

## Architecture

```
BAM Good Time                          Mahjic
┌─────────────────┐                   ┌─────────────────┐
│ Admin submits   │                   │                 │
│ scores for      │  POST /sessions   │ Receives game   │
│ event table     │ ───────────────►  │ data, updates   │
│                 │                   │ ratings         │
│ final_scores    │  ◄─────────────── │                 │
│ table updated   │  Rating changes   │ Returns new     │
│ with Mahjic     │  returned         │ ratings         │
│ rating too      │                   │                 │
└─────────────────┘                   └─────────────────┘
```

---

## Prerequisites

### 1. Register BAM Good Time as Verified Source

In Mahjic database, create the source:

```sql
INSERT INTO verified_sources (name, slug, api_key, contact_email, website, approved_at)
VALUES (
  'BAM Good Time',
  'bam-good-time',
  'mahjic_src_GENERATE_SECURE_KEY_HERE',
  'sterling@bamgoodtime.com',
  'https://bamgoodtime.com',
  now()
);
```

### 2. Add Environment Variable to BAM Good Time

```env
MAHJIC_API_KEY=mahjic_src_GENERATE_SECURE_KEY_HERE
MAHJIC_API_URL=https://mahjic.org/api/v1
```

---

## Data Mapping

### BAM Good Time → Mahjic

| BAM Field | Mahjic Field | Notes |
|-----------|--------------|-------|
| `event.date` | `session_date` | ISO date |
| `event.type` | `game_type` | `league`→`league`, `event`→`tournament`, `open_play`→`social` |
| `event_tables.player_ids` | `rounds[].players` | 4 players per table |
| `final_scores.mahjongs` | `rounds[].players[].mahjongs` | Games won |
| `final_scores.wall_games` | `rounds[].wall_games` | Same for all players at table |
| `final_scores.points` | `rounds[].players[].points` | Only for league/tournament |
| `users.email` | `rounds[].players[].email` | Player identifier |
| Calculated | `rounds[].players[].games_played` | `sum(mahjongs) + wall_games` |

### Game Type Mapping

```typescript
const gameTypeMap = {
  'league': 'league',
  'event': 'tournament',
  'open_play': 'social',
  'lesson': 'social',  // or skip lessons entirely
};
```

---

## Implementation Steps

### Step 1: Create Mahjic Client Library

Create `/src/lib/mahjic.ts` in BAM Good Time:

```typescript
const MAHJIC_API_URL = process.env.MAHJIC_API_URL || 'https://mahjic.org/api/v1';
const MAHJIC_API_KEY = process.env.MAHJIC_API_KEY;

interface MahjicRoundPlayer {
  email: string;
  games_played: number;
  mahjongs: number;
  points?: number;
}

interface MahjicRound {
  players: MahjicRoundPlayer[];
  wall_games: number;
}

interface MahjicSessionRequest {
  session_date: string;
  game_type: 'social' | 'league' | 'tournament';
  rounds: MahjicRound[];
}

interface MahjicPlayerResult {
  mahjic_id: string;
  email: string;
  is_new_player: boolean;
  rating_before: number;
  rating_after: number;
  rating_change: number;
  verified_rating_change: number;
  games_played_total: number;
}

interface MahjicSessionResponse {
  session_id: string;
  results: MahjicPlayerResult[];
}

export async function submitToMahjic(
  session: MahjicSessionRequest
): Promise<MahjicSessionResponse | null> {
  if (!MAHJIC_API_KEY) {
    console.warn('MAHJIC_API_KEY not set, skipping Mahjic submission');
    return null;
  }

  const response = await fetch(`${MAHJIC_API_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MAHJIC_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(session),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Mahjic submission failed:', error);
    throw new Error(`Mahjic API error: ${error.error?.message || 'Unknown error'}`);
  }

  return response.json();
}
```

### Step 2: Modify Score Submission Action

In BAM Good Time's score submission action (likely `src/app/(org)/(admin)/admin/events/[id]/scores/actions.ts`), add Mahjic submission after local processing:

```typescript
import { submitToMahjic } from '@/lib/mahjic';

// After saving to final_scores and calculating local ELO...

// Build Mahjic payload
const gameTypeMap: Record<string, 'social' | 'league' | 'tournament'> = {
  'league': 'league',
  'event': 'tournament',
  'open_play': 'social',
  'lesson': 'social',
};

const gamesPlayed = scores.reduce((sum, s) => sum + s.mahjongs, 0) + wallGames;

const mahjicRound = {
  players: await Promise.all(scores.map(async (score) => {
    // Get player email from users table
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', score.userId)
      .single();

    return {
      email: user?.email || '',
      games_played: gamesPlayed,
      mahjongs: score.mahjongs,
      points: eventType === 'league' || eventType === 'event' ? score.points : undefined,
    };
  })),
  wall_games: wallGames,
};

// Submit to Mahjic (fire and forget, or await for rating)
try {
  const mahjicResult = await submitToMahjic({
    session_date: event.date,
    game_type: gameTypeMap[eventType] || 'social',
    rounds: [mahjicRound],
  });

  // Optionally store Mahjic ratings alongside BAM ratings
  if (mahjicResult) {
    for (const result of mahjicResult.results) {
      await supabase
        .from('final_scores')
        .update({
          mahjic_rating_before: result.rating_before,
          mahjic_rating_after: result.rating_after,
          mahjic_rating_change: result.rating_change,
        })
        .eq('event_id', eventId)
        .eq('user_id', result.email); // Need to map back to user_id
    }
  }
} catch (error) {
  console.error('Failed to submit to Mahjic:', error);
  // Don't fail the whole submission - Mahjic is optional
}
```

### Step 3: Add Mahjic Rating Fields to BAM (Optional)

If you want to display Mahjic ratings in BAM:

```sql
-- Add to final_scores table
ALTER TABLE final_scores ADD COLUMN mahjic_rating_before INTEGER;
ALTER TABLE final_scores ADD COLUMN mahjic_rating_after INTEGER;
ALTER TABLE final_scores ADD COLUMN mahjic_rating_change INTEGER;

-- Add to player_profiles table
ALTER TABLE player_profiles ADD COLUMN mahjic_id TEXT;
ALTER TABLE player_profiles ADD COLUMN mahjic_rating INTEGER;
```

### Step 4: Handle Multi-Table Events

For events with multiple tables (rounds), submit all rounds in one request:

```typescript
// Get all tables for this event
const { data: tables } = await supabase
  .from('event_tables')
  .select('table_number, round_number, player_ids')
  .eq('event_id', eventId);

// Get all final scores
const { data: allScores } = await supabase
  .from('final_scores')
  .select('user_id, mahjongs, points, wall_games')
  .eq('event_id', eventId);

// Group scores by table
const rounds = tables.map(table => {
  const tableScores = allScores.filter(s =>
    table.player_ids.includes(s.user_id)
  );
  // ... build round object
});

await submitToMahjic({
  session_date: event.date,
  game_type: gameTypeMap[event.type],
  rounds: rounds,
});
```

---

## Privacy Considerations

### Email Privacy Modes

BAM Good Time users may want privacy. Map to Mahjic modes:

```typescript
// In user preferences or profile
interface UserPrivacy {
  mahjic_privacy: 'normal' | 'private' | 'anonymous';
}

// When building email for Mahjic
function getMahjicEmail(user: User): string {
  switch (user.mahjic_privacy) {
    case 'private':
      return `PRIVATE:${user.email}`;
    case 'anonymous':
      return `ANON:${user.display_name || user.id}`;
    default:
      return user.email;
  }
}
```

---

## Error Handling

```typescript
try {
  const result = await submitToMahjic(session);
} catch (error) {
  if (error.message.includes('invalid_session')) {
    // Validation failed - log for debugging
    console.error('Mahjic validation failed:', error);
  } else if (error.message.includes('rate_limit')) {
    // Retry later
    await queue.add('mahjic-submission', session, { delay: 60000 });
  } else {
    // Log but don't fail BAM operation
    console.error('Mahjic submission error:', error);
  }
}
```

---

## Testing

### 1. Test with Mock Data

```typescript
const testSession = {
  session_date: '2026-01-31',
  game_type: 'social' as const,
  rounds: [{
    players: [
      { email: 'test1@example.com', games_played: 4, mahjongs: 2 },
      { email: 'test2@example.com', games_played: 4, mahjongs: 1 },
      { email: 'test3@example.com', games_played: 4, mahjongs: 1 },
      { email: 'test4@example.com', games_played: 4, mahjongs: 0 },
    ],
    wall_games: 0,
  }],
};

const result = await submitToMahjic(testSession);
console.log('Created session:', result.session_id);
console.log('Rating changes:', result.results);
```

### 2. Verify in Mahjic

- Check players appear in Mahjic database
- Verify ratings calculated correctly
- Confirm game history shows BAM Good Time as source

---

## Rollout Plan

1. **Phase 1: Silent Integration**
   - Add Mahjic submission code
   - Log results but don't store
   - Monitor for errors

2. **Phase 2: Store Mahjic Ratings**
   - Add database columns
   - Store Mahjic ratings alongside BAM ratings
   - Compare calculations

3. **Phase 3: Display Mahjic Ratings**
   - Show Mahjic rating on player profiles
   - Link to mahjic.org profile
   - Add "Powered by Mahjic" badge

4. **Phase 4: Full Integration**
   - Use Mahjic as primary rating source
   - Sync player verification status
   - Display Mahjic leaderboards

---

## Files to Modify in BAM Good Time

| File | Change |
|------|--------|
| `.env.local` | Add `MAHJIC_API_KEY`, `MAHJIC_API_URL` |
| `src/lib/mahjic.ts` | New file - Mahjic client |
| `src/app/(org)/(admin)/admin/events/[id]/scores/actions.ts` | Add Mahjic submission |
| `supabase/migrations/XXX_mahjic_fields.sql` | Optional - add rating columns |
| `src/components/mahjic-rating.tsx` | Optional - display component |

---

## API Key Security

1. **Generate secure key:**
   ```bash
   openssl rand -hex 32
   # Example: mahjic_src_a1b2c3d4e5f6...
   ```

2. **Store in Supabase (Mahjic side):**
   - Hash the key before storing
   - Or use Supabase Vault for secrets

3. **Never expose in client code:**
   - Only use in server actions
   - Add to Vercel env vars for production

---

## Player Verification & Account Linking

### Overview

Players can get verified on Mahjic ($20/year) to appear on leaderboards. This section covers how BAM users link their accounts.

### Verification Flow for BAM Users

**Scenario A: Existing BAM user wants to verify**
1. User plays on BAM → BAM submits results → Mahjic creates provisional profile
2. User goes to mahjic.org/verify → logs in with same email
3. Mahjic auto-links based on email match
4. User pays $20 → completes ID verification → now Verified

**Scenario B: New user verifies first (tournament requirement)**
1. User goes to mahjic.org/verify → creates account → pays $20
2. Mahjic creates player profile with 1500 starting rating
3. User completes ID verification → now Verified
4. User plays on BAM → BAM submits with same email → profiles merge

### Adding "Link to Mahjic" in BAM

Add a button in BAM user settings to link/verify their Mahjic account:

```typescript
// src/components/mahjic-link-button.tsx
"use client";

interface MahjicLinkButtonProps {
  userEmail: string;
  mahjicId?: string;
  mahjicVerified?: boolean;
}

export function MahjicLinkButton({
  userEmail,
  mahjicId,
  mahjicVerified
}: MahjicLinkButtonProps) {
  if (mahjicVerified) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckIcon className="h-4 w-4" />
        Mahjic Verified
        <a
          href={`https://mahjic.org/players/${mahjicId}`}
          target="_blank"
          className="underline"
        >
          View Profile
        </a>
      </div>
    );
  }

  return (
    <a
      href={`https://mahjic.org/verify?email=${encodeURIComponent(userEmail)}`}
      target="_blank"
      className="btn btn-outline"
    >
      {mahjicId ? "Complete Mahjic Verification" : "Get Mahjic Verified"}
    </a>
  );
}
```

### Database Fields for BAM

```sql
-- Add to users or player_profiles table
ALTER TABLE users ADD COLUMN mahjic_player_id UUID;
ALTER TABLE users ADD COLUMN mahjic_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN mahjic_rating INTEGER;
```

### Syncing Verification Status

After BAM submits a session, Mahjic returns player info including verification status:

```typescript
interface MahjicPlayerResult {
  mahjic_id: string;
  email: string;
  is_new_player: boolean;
  tier: 'provisional' | 'verified';  // Add this to API response
  rating_before: number;
  rating_after: number;
  // ...
}

// After successful submission, update BAM user records
for (const result of mahjicResult.results) {
  await supabase
    .from('users')
    .update({
      mahjic_player_id: result.mahjic_id,
      mahjic_verified: result.tier === 'verified',
      mahjic_rating: result.rating_after,
    })
    .eq('email', result.email);
}
```

### Webhook for Verification Events (Future)

Mahjic could send webhooks when users verify:

```typescript
// POST to BAM's webhook endpoint
{
  "event": "player.verified",
  "player_id": "uuid",
  "email": "user@example.com",
  "verified_at": "2026-02-02T..."
}
```

This lets BAM update verification status in real-time without polling.

---

## Questions to Resolve

1. **Should lessons be submitted to Mahjic?**
   - Recommendation: No, skip lessons

2. **What if a player doesn't have an email in BAM?**
   - Use `ANON:DisplayName` format

3. **Should BAM display Mahjic ratings or keep separate?**
   - Recommendation: Display both, let Mahjic be the "official" one

4. **Retry strategy for failed submissions?**
   - Recommendation: Queue with exponential backoff

5. **Should Mahjic send verification webhooks to BAM?**
   - Recommendation: Yes, add to Phase 4

---

## Codebase Locations

**BAM Good Time:**
- Project: `/Users/sterlinglcannon/Desktop/Bam Good Time/bam-good-time`
- Score submission: `src/app/(org)/(admin)/admin/events/[id]/scores/actions.ts`
- ELO algorithm: `src/lib/elo.ts`
- Types: `src/types/`

**Mahjic:**
- Project: `/Users/sterlinglcannon/Desktop/Mahjic`
- API endpoint: `src/app/api/v1/sessions/route.ts`
- ELO algorithm: `src/lib/elo.ts`
- API docs: `API-REFERENCE.md`

---

*Ready to implement. Start with Step 1 (Mahjic client library) and work through sequentially.*
