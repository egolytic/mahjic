# Technical Context

## Tech Stack (Implemented)

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | Next.js 16 (App Router) | ✅ Deployed |
| Styling | Tailwind CSS 4 | ✅ |
| Database | Supabase (PostgreSQL) | ✅ 8 tables |
| Auth | Supabase Auth (magic links) | ✅ |
| Hosting | Vercel | ✅ mahjic.org |
| Identity | Stripe Identity | ✅ Webhook configured |
| Fonts | Playfair Display + Lato | ✅ |

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `players` | Player accounts, ratings, tier |
| `verified_sources` | Clubs/platforms that submit games |
| `game_sessions` | Container for a day's games |
| `rounds` | Same 4 people playing X games |
| `round_players` | Individual results per round |
| `rating_history` | Rating changes over time |
| `claim_tokens` | Profile claiming for provisional players |
| `source_applications` | Pending source applications |
| `verification_sessions` | Stripe Identity tracking |

### Key Columns

**players:**
- `mahjic_rating` - Rating from all games
- `verified_rating` - Rating vs verified players only
- `tier` - 'provisional' or 'verified'
- `privacy_mode` - 'normal', 'private', 'anonymous'
- `auth_user_id` - Links to Supabase Auth

**verified_sources:**
- `api_key` - Bearer token for API auth
- `approved_at` - NULL = pending, set = approved

## API Endpoints

Base URL: `https://mahjic.org/api/v1`

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/sessions` | API Key | Submit games |
| GET | `/players/[id]` | None | Player profile |
| GET | `/players/[id]/history` | None | Game history |
| GET | `/leaderboard` | None | Verified rankings |
| GET | `/sources` | None | List sources |
| POST | `/sources/apply` | None | Apply to be source |

### Webhooks

| Endpoint | Purpose |
|----------|---------|
| `/api/webhooks/stripe` | Stripe Identity events |

## Rating Algorithm

### ELO with Pairwise Comparison

Located at `src/lib/elo.ts`:

```typescript
// Key functions
getKFactor(gamesPlayed)        // 32 → 24 → 16
calculateExpectedScore(a, b)    // Standard ELO formula
calculateActualScore(a, b)      // 1/0.5/0 based on mahjongs
calculatePointsBonus(a, b)      // ±5 cap for league/tournament
calculateTableEloChanges(players, options)  // Process full table
```

### K-Factor

| Games Played | K-Factor |
|--------------|----------|
| < 30 | 32 |
| 30-100 | 24 |
| > 100 | 16 |

### Points Bonus (League/Tournament)
```
Bonus = (player_points - opponent_points) / 50
Capped at ±5
```

## Stripe Integration

### Identity Verification Flow
1. Player clicks "Upgrade to Verified"
2. API creates Stripe Identity session
3. Player scans ID + selfie
4. Webhook receives `identity.verification_session.verified`
5. Player updated to `tier: 'verified'`

### Webhook Events Handled
- `identity.verification_session.verified`
- `identity.verification_session.requires_input`
- `identity.verification_session.canceled`
- `checkout.session.completed`

## Verified Sources

### BAM Good Time (Source #1)

```
ID: 5c1c7973-c840-45da-a0f7-34f39959131d
Slug: bam-good-time
API Key: mahjic_src_03388fcb2648ff18f33280b7e47e4f1e199832c96ff83621daa7282c6f769ed8
```

### API Authentication
```
Authorization: Bearer mahjic_src_...
```

## Brand Colors

```css
--aqua: #a7e5ee;
--aqua-soft: #d9f3f7;
--green: #6ac674;
--green-deep: #4a8f53;
--coral: #fd5d9d;
--coral-hover: #e8528c;
--gold: #d4a84b;
--cream: #fdfaf6;
--text: #3a5245;
```

## Key Dependencies

```json
{
  "next": "16.1.6",
  "react": "19.2.3",
  "@supabase/supabase-js": "2.93.3",
  "@supabase/ssr": "0.8.0",
  "stripe": "20.3.0",
  "tailwindcss": "4.1.18"
}
```
