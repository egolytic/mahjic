# Mahjic Rating System

> The open, universal rating system for American Mahjong.

---

## Mission

Mahjic exists to provide a **free, open, and portable** skill rating for American Mahjong players — one that belongs to the players, not a corporation.

**Competitive positioning:** Unlike closed systems that lock players in, Mahjic ratings belong to the players. Open source algorithm, transparent methodology, portable ratings. Play anywhere, take your rating everywhere.

---

## Core Principles

1. **Open Formula** — The rating algorithm is public and documented. No black boxes.
2. **Open API** — Any developer can integrate Mahjic ratings into their app or website.
3. **Verified Sources** — Trusted clubs and platforms submit results; quality over quantity.
4. **Player Ownership** — Your rating is yours. It follows you across clubs and platforms.
5. **Community Governed** — Major changes go through an open process.

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
3. Manual review (Claude-powered agent as volume grows)
4. Approved → receive API key + login credentials + documentation

### Cost

**Free.** Goal is adoption and ecosystem growth.

---

## Player Identity & Verification

### Player Tiers

| Tier | How to Get | Features | Cost |
|------|------------|----------|------|
| **Provisional** | Any Verified Source submits a game with you | Has rating, can view history, NOT on leaderboards | Free |
| **Verified** | Pay + Stripe Identity check | Full access, appears on leaderboards, verified badge, ID confirmed | $20/year |

### Player Creation Flow

1. Verified Source submits a game with a new player (name + email)
2. Mahjic creates a **Provisional** account with unique Mahjic ID
3. Player receives email: "You've been rated! Claim your profile"
4. Player can optionally upgrade to **Verified** ($20/year + Stripe Identity)

### Privacy Options

| Mode | How to Submit | Description |
|------|---------------|-------------|
| **Normal** | `alice@example.com` | Full participation, public profile |
| **Private** | `PRIVATE:alice@example.com` | Rated and portable, hidden from public search/leaderboards |
| **Anonymous** | `ANON:PlayerNickname` | No email, club assigns pseudonym, local to one source only |

### Two Rating System

To prevent gaming via fake provisional accounts:

| Rating Type | Games Counted | Used For |
|-------------|---------------|----------|
| **Mahjic Rating** | All games | Personal tracking, full history |
| **Verified Rating** | Only games vs Verified players | Leaderboards, official rankings |

---

## The Rating Algorithm

### Overview

Mahjic uses **ELO with pairwise comparison** adapted for 4-player Mahjong, with optional points weighting for league/tournament play.

### Core Concept: Win Rate Comparison

In Mahjong, players compete at a table across multiple games. The comparison is based on **win rate** (mahjongs / games played):

- Each player is compared pairwise against each tablemate
- Higher win rate = win, equal = tie, lower = loss
- Standard ELO formula applied to each pairwise comparison
- Changes summed for total ELO change

### Game Outcomes

Each game has exactly ONE outcome:
- One player mahjongs (wins), OR
- Wall game (nobody wins - pot exhausted)

**Validation:** `sum(all players' mahjongs) + wall_games = games_played`

### Expected Score Formula

```
Expected = 1 / (1 + 10^((opponent_rating - player_rating) / 400))
```

### K-Factor (Rating Volatility)

| Games Played | K-Factor | Effect |
|--------------|----------|--------|
| < 30 | 32 | High volatility (new players adjust quickly) |
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

**Round:** Alice (1600), Bob (1550), Carol (1500), Dave (1450)
**Results:** 6 games played, 1 wall game

| Player | Mahjongs | Win Rate |
|--------|----------|----------|
| Alice | 2 | 33% |
| Bob | 2 | 33% |
| Carol | 1 | 17% |
| Dave | 0 | 0% |

**Pairwise results for Alice:**
- vs Bob: Tie (33% = 33%)
- vs Carol: Win (33% > 17%)
- vs Dave: Win (33% > 0%)

ELO changes calculated for each matchup and summed.

### Rating Scale

| Rating | Description |
|--------|-------------|
| 1800+ | Expert — Consistently wins against strong competition |
| 1600-1799 | Advanced — Solid fundamentals, reads the card well |
| 1400-1599 | Intermediate — Understands strategy, improving |
| 1200-1399 | Beginner — Learning the game, building skills |
| <1200 | Newcomer — Just getting started |

*Starting rating for new players: 1500*

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
| `rounds` | Yes | Array of rounds (each round = same people playing together) |
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
| **League** | Yes | Regular season play with full scoring |
| **Tournament** | Yes | Competitive events with full scoring |

### Special Cases

| Format | How to Handle |
|--------|---------------|
| **Siamese (2 players)** | Submit round with 2 players |
| **"Bob" (imaginary player)** | Use `bob@mahjic.org` — fixed 1500 rating, never changes |
| **League night (2 rounds)** | Submit 2 rounds with different player combinations |

### League Night Example

Typical league night: 2 rounds of 4 games each, different opponents each round.

```json
{
  "source_id": "columbus-mahjong-league",
  "session_date": "2026-01-31",
  "game_type": "league",
  "rounds": [
    {
      "players": [
        { "email": "alice@ex.com", "games_played": 4, "mahjongs": 2, "points": 125 },
        { "email": "bob@ex.com", "games_played": 4, "mahjongs": 1, "points": 80 },
        { "email": "carol@ex.com", "games_played": 4, "mahjongs": 1, "points": 45 },
        { "email": "dave@ex.com", "games_played": 4, "mahjongs": 0, "points": -50 }
      ],
      "wall_games": 0
    },
    {
      "players": [
        { "email": "alice@ex.com", "games_played": 4, "mahjongs": 1, "points": 60 },
        { "email": "eve@ex.com", "games_played": 4, "mahjongs": 2, "points": 110 },
        { "email": "frank@ex.com", "games_played": 4, "mahjongs": 0, "points": 40 },
        { "email": "george@ex.com", "games_played": 4, "mahjongs": 0, "points": -10 }
      ],
      "wall_games": 1
    }
  ]
}
```

---

## Integration Methods

### 1. REST API (for Platforms)

For platforms like BAM Good Time that integrate programmatically.

```
POST https://api.mahjic.org/v1/sessions
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

See API-REFERENCE.md for full documentation.

### 2. Web Form (for Small Clubs)

- Login at mahjic.org/submit
- Enter round data manually
- Immediate feedback on rating changes

### 3. CSV/Excel Upload (for Leagues)

Template spreadsheet format:

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

**Conventions:**
- `PRIVATE:email` → private mode (rated but hidden)
- `ANON:Nickname` → anonymous player (local only)

---

## Open Source Strategy

### What Gets Open Sourced

| Component | Open Source? | Repository |
|-----------|--------------|------------|
| ELO Algorithm | Yes | `mahjic/rating-algorithm` |
| API Specification | Yes | `mahjic/api-spec` (OpenAPI) |
| Client Libraries | Yes | `mahjic/python-client`, `mahjic/js-client` |
| Mahjic.org Website | No | Private |
| Player Database | No | Private |
| Verification System | No | Private (revenue stream) |

### The Pitch to Other Platforms

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
| **Identity Verification** | Stripe Identity for Verified players (gov ID) |
| **Trusted Sources** | Only Verified Sources can submit games |
| **Anti-Fraud** | Two ratings (Overall vs Verified-only) |
| **Track Record** | BAM Good Time as reference implementation |

### Responding to Attacks

| Attack | Response |
|--------|----------|
| "Mahjic ratings are fake" | "Every Verified player is ID-checked. Show us YOUR verification." |
| "Anyone can submit games" | "Only approved Verified Sources can submit. We vet them." |
| "Their algorithm is wrong" | "It's open source. Read it. Suggest improvements." |
| "We're the official system" | "Official to whom? We're player-owned, not gatekeeper-owned." |

### Future Governance

- **Advisory Board:** 3-5 respected Mahjong community members
- **Algorithm Change Process:** Public proposals, community feedback
- **Annual Transparency Report:** Stats on players, games, sources

---

## Roadmap

### Phase 1: MVP
- [ ] Mahjic.org website (player profiles, ratings, leaderboards)
- [ ] API for Verified Sources
- [ ] Web form + CSV upload
- [ ] BAM Good Time integration (reference implementation)
- [ ] Stripe Identity for Verified players

### Phase 2: Growth
- [ ] Claude-powered Verified Source review
- [ ] Python and JavaScript client libraries
- [ ] Regional leaderboards
- [ ] Embeddable widgets (rating badges, leaderboards)

### Phase 3: Mobile
- [ ] NFC-enabled app for real-time game logging
- [ ] Players tap phones after each game
- [ ] Auto-capture hand type (concealed, row, etc.)
- [ ] Points calculated automatically
- [ ] Clubs don't need to track anything

---

## Technical Decisions (TBD)

- [ ] Tech stack for Mahjic.org (Next.js recommended)
- [ ] Database (Supabase recommended)
- [ ] Hosting (Vercel recommended)
- [ ] Domain setup (mahjic.org secured)
- [ ] Stripe Identity integration details
- [ ] API rate limiting strategy

---

## Why "Mahjic"?

**Mahj** (mahjong) + **Magic** = **Mahjic**

It's memorable, easy to spell, and captures the joy of the game. The "jic" ending also hints at "logic" — the transparent, mathematical foundation of the rating system.

---

*This spec is a living document. Feedback welcome.*

*Last updated: January 2026*
