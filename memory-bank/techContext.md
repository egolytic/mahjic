# Technical Context

## Tech Stack (Planned)

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js | Same as BAM Good Time for familiarity |
| Database | Supabase | PostgreSQL + Auth + RLS |
| Hosting | Vercel | Easy deployment |
| Identity Verification | Stripe Identity | For Verified player tier |
| Email | Resend | Transactional emails |

## Rating Algorithm

### Core: ELO with Pairwise Comparison

Adapted for 4-player Mahjong using **win rate comparison**:

1. Calculate win rate: `mahjongs / games_played`
2. Compare each player pairwise against tablemates
3. Higher win rate = win, equal = tie, lower = loss
4. Apply standard ELO formula per matchup
5. Sum all pairwise changes

### Expected Score Formula
```
Expected = 1 / (1 + 10^((opponent_rating - player_rating) / 400))
```

### K-Factor (Volatility)

| Games Played | K-Factor |
|--------------|----------|
| < 30 | 32 (new players adjust quickly) |
| 30-100 | 24 |
| > 100 | 16 (stable rating) |

### Points Bonus (League/Tournament Only)
```
Bonus = (player_points - opponent_points) / 50
Capped at ±5
```

### Starting Rating
- All new players start at **1500**
- "Bob" (imaginary player) is fixed at 1500

## API Design

### Base URL
`https://api.mahjic.org/v1`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions` | Submit game session (auth required) |
| GET | `/players/{id}` | Get player profile |
| GET | `/players/{id}/history` | Rating history |
| GET | `/leaderboard` | Global leaderboard (Verified only) |
| GET | `/sources` | List Verified Sources |

### Authentication
- API key per Verified Source
- `Authorization: Bearer {api_key}`

## Open Source Components

| Component | Open Source? | Repository |
|-----------|--------------|------------|
| ELO Algorithm | Yes | `mahjic/rating-algorithm` |
| API Spec (OpenAPI) | Yes | `mahjic/api-spec` |
| Client Libraries | Yes | `mahjic/python-client`, `mahjic/js-client` |
| Mahjic.org Website | No | Private |
| Player Database | No | Private |

## Existing Code (BAM Good Time)

The ELO algorithm already exists in BAM Good Time and can be extracted:

- `src/lib/elo.ts` - Core ELO calculation
- `src/lib/effective-skill.ts` - Blended skill levels
- `src/lib/seating-algorithms.ts` - Table assignment logic

Key functions to adapt:
- `calculateTableEloChanges()` - Process a round
- `getKFactor()` - Experience-based K-factor
- `calculatePointsBonus()` - Points weighting

## Database Schema (Planned)

### Core Tables
- `players` - Mahjic ID, email, ratings, tier, privacy
- `sources` - Verified Sources (clubs/platforms)
- `sessions` - Game session submissions
- `rounds` - Individual rounds within sessions
- `round_players` - Player results per round
- `rating_history` - Historical rating snapshots

### Key Relationships
- Player belongs to many Sources (via rounds)
- Session belongs to one Source
- Session has many Rounds
- Round has many RoundPlayers
