# Mahjic.org - Open Mahjong Rating System

**Design Document**
**Date:** 2026-01-31
**Status:** Draft

---

## Mission

The open, player-centric rating system for Mahjong. Play anywhere, take your rating everywhere.

**Competitive positioning:** Unlike closed systems that lock players in, Mahjic ratings belong to the players. Open source algorithm, transparent methodology, portable ratings.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      MAHJIC.ORG                              │
│                  (Central Rating Authority)                  │
├─────────────────────────────────────────────────────────────┤
│  • Player Registry (Mahjic ID, profile, verification)       │
│  • Rating Engine (ELO + points weighting)                   │
│  • Game History (every rated game ever played)              │
│  • Leaderboards (global, regional, by club)                 │
│  • Verified Source Registry                                 │
└─────────────────────────────────────────────────────────────┘
           ▲              ▲              ▲
           │ API          │ Web Form     │ CSV Upload
           │              │              │
    ┌──────┴──────┐  ┌────┴────┐  ┌──────┴──────┐
    │ BAM Good    │  │ Small   │  │ League      │
    │ Time        │  │ Club    │  │ with        │
    │ (Platform)  │  │ (Manual)│  │ Spreadsheet │
    └─────────────┘  └─────────┘  └─────────────┘
       Verified        Verified      Verified
       Source          Source        Source
```

Mahjic.org is the hub. All ratings, all players, all games live there. Verified Sources (clubs, platforms) submit game results. Players can view their rating, history, and standings on Mahjic.org regardless of where they play.

---

## Player Identity & Verification

### Player Tiers

| Tier | How to Get | Features |
|------|------------|----------|
| **Provisional** | Any Verified Source submits a game with you | Has rating, can view history, NOT on leaderboards |
| **Verified** | Pay $20/year + Stripe Identity check | Full access, appears on leaderboards, verified badge |

### Player Creation Flow

1. Verified Source submits a game with a new player (name + email)
2. Mahjic creates a **Provisional** account with unique Mahjic ID
3. Player receives email: "You've been rated! Claim your profile"
4. Player can optionally upgrade to **Verified** ($20/year + Stripe Identity)

### Privacy Options

| Mode | Description | Use Case |
|------|-------------|----------|
| **Normal** | Full participation, public profile | Most players |
| **Private** | Rated and portable, hidden from public search/leaderboards | Privacy-conscious players |
| **Anonymous** | No email, club assigns pseudonym (e.g., `ANON:Dave`) | Players who don't want any data stored |

### Two Rating System

To prevent gaming via fake provisional accounts:

| Rating Type | Games Counted | Used For |
|-------------|---------------|----------|
| **Mahjic Rating** | All games | Personal tracking |
| **Verified Rating** | Only games vs Verified players | Leaderboards, official rankings |

---

## Verified Sources

### Definition

Verified Sources are clubs, platforms, or leagues authorized to submit game results to Mahjic.org. Only games from Verified Sources count toward ratings.

### Types

| Type | Integration Method | Examples |
|------|-------------------|----------|
| **Platforms** | REST API with API key | BAM Good Time, future apps |
| **Clubs** | Web form or CSV upload | Local Mahjong clubs |
| **Leagues** | CSV upload | Regional tournament organizers |

### Onboarding Flow

1. Club/platform applies at mahjic.org/become-a-source
2. Simple form: org name, contact info, website/social, brief description
3. Manual review (Claude-powered agent later as volume grows)
4. Approved → receive API key + login credentials + documentation

### Cost

**Free.** Goal is adoption. This is also the sales funnel for BAM Good Time.

---

## Game Submission

### Data Model

```json
{
  "source_id": "bam-good-time",
  "session_date": "2026-01-31",
  "game_type": "social | league | tournament",
  "rounds": [
    {
      "players": [
        {
          "email": "alice@example.com",
          "games_played": 6,
          "mahjongs": 2,
          "points": 125
        },
        {
          "email": "bob@example.com",
          "games_played": 6,
          "mahjongs": 2,
          "points": 80
        },
        {
          "email": "carol@example.com",
          "games_played": 6,
          "mahjongs": 1,
          "points": 45
        },
        {
          "email": "PRIVATE:dave@example.com",
          "games_played": 6,
          "mahjongs": 0,
          "points": -50
        }
      ],
      "wall_games": 1
    }
  ]
}
```

### Field Definitions

| Field | Required | Description |
|-------|----------|-------------|
| `source_id` | Yes | Verified Source identifier |
| `session_date` | Yes | Date of play |
| `game_type` | Yes | `social`, `league`, or `tournament` |
| `rounds` | Yes | Array of rounds (each round = same 4 people playing together) |
| `players` | Yes | Array of 2-4 players in the round |
| `email` | Yes* | Player identifier. Prefix with `PRIVATE:` for private mode or `ANON:` for anonymous |
| `games_played` | Yes | Number of games played in this round |
| `mahjongs` | Yes | Number of games won by this player |
| `points` | League/Tournament only | Total points scored in this round |
| `wall_games` | Yes | Number of games with no winner (pot exhausted) |

### Validation Rules

- `sum(all players' mahjongs) + wall_games = games_played`
- All players in a round must have same `games_played` value
- `points` required for league/tournament, ignored for social

### Game Types

| Type | Points Required? | Use Case |
|------|------------------|----------|
| **Social** | No | Casual club nights, just counting mahjongs |
| **League** | Yes | Regular season play with scoring |
| **Tournament** | Yes | Competitive events with scoring |

### Special Cases

| Format | How to Handle |
|--------|---------------|
| **Siamese (2 players)** | Submit round with 2 players |
| **"Bob" (imaginary player)** | Use `bob@mahjic.org` - fixed 1500 rating, never changes |
| **League night (2 rounds)** | Submit 2 rounds with different player combinations |

---

## Rating Algorithm

### Core ELO Calculation

Pairwise comparison using win rate:

1. Calculate win rate for each player: `mahjongs / games_played`
2. Compare each player against each other player at the table
3. Higher win rate = win, equal = tie, lower = loss
4. Apply standard ELO formula for each pairwise comparison
5. Sum all pairwise changes for total ELO change

### Expected Score Formula

```
Expected = 1 / (1 + 10^((opponent_rating - player_rating) / 400))
```

### K-Factor (Rating Volatility)

| Games Played | K-Factor | Effect |
|--------------|----------|--------|
| < 30 | 32 | High volatility (new players) |
| 30-100 | 24 | Medium volatility |
| > 100 | 16 | Stable rating (experienced players) |

### Points Bonus (League/Tournament Only)

For league and tournament games, an additional bonus based on point differential:

```
Bonus = (player_points - opponent_points) / 50
Capped at ±5
```

This rewards dominant wins without overwhelming the mahjong-based comparison.

### Example Calculation

Round: Alice (1600), Bob (1550), Carol (1500), Dave (1450)
Results: Alice 2 mahjongs, Bob 2 mahjongs, Carol 1 mahjong, Dave 0 mahjongs (6 games, 1 wall)

Win rates: Alice 33%, Bob 33%, Carol 17%, Dave 0%

Pairwise results for Alice:
- vs Bob: Tie (33% = 33%)
- vs Carol: Win (33% > 17%)
- vs Dave: Win (33% > 0%)

ELO changes calculated for each matchup and summed.

---

## Integration Methods

### 1. REST API (for Platforms)

```
POST https://api.mahjic.org/v1/sessions
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "session_date": "2026-01-31",
  "game_type": "league",
  "rounds": [...]
}
```

Response:
```json
{
  "session_id": "sess_abc123",
  "results": [
    {
      "mahjic_id": "MJ-001",
      "email": "alice@example.com",
      "rating_before": 1600,
      "rating_after": 1624,
      "change": +24,
      "verified_rating_before": 1580,
      "verified_rating_after": 1598,
      "verified_change": +18
    }
  ]
}
```

### 2. Web Form (for Small Clubs)

- Login at mahjic.org/submit
- Enter round data manually
- Immediate feedback on rating changes

### 3. CSV/Excel Upload (for Leagues)

Template spreadsheet:

```
MAHJIC SCORE SHEET                    Date: 2026-01-31
Game Type: League

ROUND 1 | Games Played: 4 | Wall Games: 0
Player Email          | Mahjongs | Points
alice@example.com     | 2        | 125
bob@example.com       | 1        | 80
carol@example.com     | 1        | 45
dave@example.com      | 0        | -50

ROUND 2 | Games Played: 4 | Wall Games: 1
Player Email          | Mahjongs | Points
alice@example.com     | 1        | 60
eve@example.com       | 2        | 110
frank@example.com     | 0        | 40
george@example.com    | 0        | -10
```

Conventions:
- `PRIVATE:email` → private mode
- `ANON:Nickname` → anonymous player

---

## BAM Good Time Integration

BAM Good Time becomes Verified Source #1 and the reference implementation.

### Integration Flow

1. Club admin submits scores in BAM Good Time (existing flow)
2. BAM Good Time calls Mahjic API with round data
3. Mahjic returns updated ratings and Mahjic IDs
4. BAM Good Time stores Mahjic IDs on user records
5. UI displays Mahjic Rating with link to Mahjic.org profile

### Data Sync

- BAM Good Time caches ratings locally for display
- Mahjic.org is always the source of truth
- Players can view full history on Mahjic.org

### Sales Funnel

When manually reviewing Verified Source applications:
- Direct touchpoint with club organizers
- Opportunity to pitch BAM Good Time platform
- "You're approved! BTW, are you using spreadsheets to manage your club?"

---

## Open Source Strategy

### What Gets Open Sourced

| Component | Open Source? | Repository |
|-----------|--------------|------------|
| ELO Algorithm | ✅ Yes | `mahjic/rating-algorithm` |
| API Specification | ✅ Yes | `mahjic/api-spec` (OpenAPI) |
| Client Libraries | ✅ Yes | `mahjic/python-client`, `mahjic/js-client` |
| Mahjic.org Website | ❌ No | Private |
| Player Database | ❌ No | Private |
| Verification System | ❌ No | Private (revenue stream) |

### The Pitch

> "Use the open Mahjic rating algorithm. Submit games to Mahjic.org (the official registry) via our free API. Your players get portable ratings they can take anywhere."

---

## Legitimacy & Governance

### Positioning vs Closed Systems

| Closed System | Mahjic |
|---------------|--------|
| Play OUR events only | Play anywhere |
| Ratings locked to their platform | Ratings travel with YOU |
| Black box algorithm | Open source, auditable |
| They control everything | Community-driven |
| Pay to participate | Free for clubs |

### Trust Elements

| Element | Implementation |
|---------|----------------|
| **Transparency** | Open source algorithm on GitHub |
| **Identity Verification** | Stripe Identity for Verified players |
| **Trusted Sources** | Only Verified Sources can submit |
| **Anti-Fraud** | Two ratings (Overall vs Verified-only) |
| **Track Record** | BAM Good Time as reference implementation |

### Responding to Attacks

| Attack | Response |
|--------|----------|
| "Mahjic ratings are fake" | "Every Verified player is ID-checked. Show us YOUR verification." |
| "Anyone can submit games" | "Only approved Verified Sources can submit. We vet them." |
| "Their algorithm is wrong" | "It's open source. Read it. Suggest improvements." |
| "We're the official system" | "Official to whom? We're player-owned, not gatekeeper-owned." |

### Future Governance (Optional)

- **Advisory Board:** 3-5 respected Mahjong community members
- **Algorithm Change Process:** Public proposals, community feedback
- **Annual Transparency Report:** Stats on players, games, sources

---

## Future Roadmap

### Phase 1: MVP
- Mahjic.org website (player profiles, ratings, leaderboards)
- API for Verified Sources
- Web form + CSV upload
- BAM Good Time integration

### Phase 2: Growth
- Claude-powered Verified Source review
- More client libraries
- Regional leaderboards

### Phase 3: Mobile
- NFC-enabled app for real-time game logging
- Players tap phones after each game
- Auto-capture hand type (concealed, row, etc.)
- Points calculated automatically
- Clubs don't need to track anything

---

## Technical Decisions (TBD)

- [ ] Tech stack for Mahjic.org (Next.js? Same as BAM Good Time?)
- [ ] Database (Supabase? Separate instance?)
- [ ] Hosting (Vercel?)
- [ ] Domain setup (mahjic.org)
- [ ] Stripe Identity integration details
- [ ] API rate limiting strategy

---

## Appendix: Mahjong Game Rules Reference

### Game Outcomes
- Each game has exactly ONE outcome: one player mahjongs (wins) OR wall game (no winner)
- Validation: `sum(all mahjongs) + wall_games = games_played`

### Formats Supported
- **4-player standard:** Most common
- **2-player Siamese:** Works with 2-player rounds
- **"Bob" (imaginary player):** Fixed 1500 rating opponent for solo protocols

### Scoring (League/Tournament)
- Points vary by hand type (concealed, row, etc.)
- Clubs may score differently
- Mahjic accepts whatever point totals the club uses
