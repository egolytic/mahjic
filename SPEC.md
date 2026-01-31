# Mahjic Rating System

> An open, universal rating system for American Mahjong players.

---

## Mission

Mahjic exists to provide a **free, open, and portable** skill rating for American Mahjong players — one that belongs to the community, not a corporation.

Any league, app, or organizer can integrate with Mahjic. Players own their rating and take it with them wherever they play.

---

## Core Principles

1. **Open Formula** — The rating algorithm is public and documented. No black boxes.
2. **Open API** — Any developer can integrate Mahjic ratings into their app or website.
3. **Federated Data** — League organizers submit results; no single entity controls the data.
4. **Player Ownership** — Your rating is yours. It follows you across leagues and platforms.
5. **Community Governed** — Major changes go through an open RFC process.

---

## The Rating System

### Algorithm: Glicko-2

Mahjic uses **Glicko-2**, an evolution of the classic Elo system developed by Mark Glickman at Boston University. It's the same system used by Lichess (the open-source chess platform) and offers several advantages over basic Elo:

**Three components per player:**
- **Rating (r)** — Your skill estimate (starts at 1500)
- **Rating Deviation (RD)** — Confidence interval (how certain the system is)
- **Volatility (σ)** — How consistent your performance is

**Why Glicko-2?**
- Accounts for inactivity (RD increases over time if you don't play)
- Better handles new players (provisional ratings adjust faster)
- More accurate predictions than basic Elo
- Well-documented, peer-reviewed, freely available

### Rating Scale

| Rating | Description |
|--------|-------------|
| 1800+ | Expert — Consistently wins against strong competition |
| 1600-1799 | Advanced — Solid fundamentals, reads the card well |
| 1400-1599 | Intermediate — Understands strategy, improving |
| 1200-1399 | Beginner — Learning the game, building skills |
| <1200 | Newcomer — Just getting started |

*Note: These are guidelines. The system is relative — what matters is how you perform against other rated players.*


### Adapting for Mahjong

Traditional Elo/Glicko were designed for two-player games. American Mahjong has four players per game. Mahjic handles this by:

**Option A: Pairwise Comparison**
Each game generates 6 pairwise comparisons (Player A vs B, A vs C, A vs D, B vs C, B vs D, C vs D). Winner beats all three opponents; others are compared by final position.

**Option B: Placement-Based**
Points awarded based on finishing position:
- 1st place: Win vs. field
- 2nd place: Partial win
- 3rd place: Partial loss
- 4th place: Loss vs. field

**Option C: Score-Based** (if tracking points)
Margin of victory matters — a Mahjong win is weighted more heavily than a close game.

*Initial implementation will use Option A (pairwise) for simplicity and mathematical soundness. Community input welcome.*

---

## How It Works

### For Players

1. **Create an account** at mahjic.org
2. **Link to leagues** where you play (or self-report games)
3. **Play mahjong** — your games are recorded
4. **Track your progress** — see your rating, history, and stats
5. **Share your profile** — embed your Mahjic rating anywhere

### For League Organizers

1. **Register your league** at mahjic.org
2. **Get API credentials** (free for non-commercial use)
3. **Submit game results** via API or simple web form
4. **Display ratings** — embed leaderboards on your site
5. **Optional: Verified badge** — leagues can apply for verified status

### For Developers

1. **Read the docs** at docs.mahjic.org
2. **Get an API key** (free tier available)
3. **Integrate** — query player ratings, submit results, embed widgets
4. **Contribute** — the core is open source (MIT license)

---

## Data Model

### Player
```json
{
  "id": "mj_abc123",
  "username": "TileQueen",
  "rating": 1587,
  "rd": 45,
  "volatility": 0.06,
  "games_played": 142,
  "last_played": "2025-01-20",
  "provisional": false,
  "created_at": "2024-03-15"
}
```

### Game Result
```json
{
  "id": "game_xyz789",
  "timestamp": "2025-01-20T19:30:00Z",
  "league_id": "league_columbus_mj",
  "players": [
    { "player_id": "mj_abc123", "position": 1, "score": 50 },
    { "player_id": "mj_def456", "position": 2, "score": 25 },
    { "player_id": "mj_ghi789", "position": 3, "score": 0 },
    { "player_id": "mj_jkl012", "position": 4, "score": -25 }
  ],
  "verified": true,
  "submitted_by": "league_columbus_mj"
}
```

### League
```json
{
  "id": "league_columbus_mj",
  "name": "Columbus Mahjong League",
  "location": "Columbus, GA",
  "organizer_id": "user_heather",
  "verified": true,
  "games_submitted": 847,
  "active_players": 32,
  "created_at": "2024-06-01"
}
```


---

## API Overview

Base URL: `https://api.mahjic.org/v1`

### Public Endpoints (no auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/players/{id}` | Get player profile and rating |
| GET | `/players/{id}/history` | Get rating history |
| GET | `/players/search?q={query}` | Search players by username |
| GET | `/leaderboard` | Global top players |
| GET | `/leaderboard/{region}` | Regional leaderboard |
| GET | `/leagues` | List all leagues |
| GET | `/leagues/{id}` | Get league details |
| GET | `/leagues/{id}/leaderboard` | League-specific rankings |

### Authenticated Endpoints (API key required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/games` | Submit a game result |
| POST | `/games/bulk` | Submit multiple games |
| PUT | `/players/{id}` | Update player profile |
| POST | `/leagues` | Register a new league |

### Webhooks (for integrations)

- `game.submitted` — Fired when a game is recorded
- `rating.updated` — Fired when a player's rating changes
- `player.milestone` — Fired when player hits rating milestone

---

## Verification & Trust

### Player Verification Levels

1. **Unverified** — Self-reported games only
2. **League Player** — Has games submitted by a registered league
3. **Verified** — Identity confirmed (optional, for tournament play)

### League Verification

Leagues can apply for **Verified League** status by:
- Having an active organizer account
- Submitting at least 20 games with 8+ unique players
- Passing a brief review (to prevent fraud)

Verified leagues get:
- Verified badge on leaderboards
- Higher trust weight for rating calculations
- Priority API support

### Anti-Gaming Measures

- **Mutual confirmation** — For self-reported games, both players must confirm
- **Anomaly detection** — Flags suspicious patterns (rapid rating swings, always playing same opponents)
- **Decay for inactivity** — RD increases if you don't play, preventing rating camping
- **Public game history** — Transparency discourages manipulation


---

## Roadmap

### Phase 1: Foundation (MVP)
- [ ] Landing page at mahjic.org
- [ ] Player registration and profiles
- [ ] Manual game entry (web form)
- [ ] Basic Glicko-2 implementation
- [ ] Public leaderboard
- [ ] Player search

### Phase 2: League Integration
- [ ] League organizer accounts
- [ ] API for game submission
- [ ] League-specific leaderboards
- [ ] Embeddable widgets (rating badges, leaderboards)
- [ ] Verification system

### Phase 3: Community Features
- [ ] Rating history charts
- [ ] Head-to-head records
- [ ] Achievement badges
- [ ] Social features (follow players, activity feed)
- [ ] Mobile app (or PWA)

### Phase 4: Ecosystem
- [ ] Open source release (MIT license)
- [ ] Developer documentation
- [ ] Third-party app integrations
- [ ] Tournament management tools
- [ ] Regional/national rankings

---

## Governance

Mahjic is community-governed. Major decisions follow an RFC (Request for Comments) process:

1. **Proposal** — Anyone can submit an RFC via GitHub
2. **Discussion** — 2-week comment period
3. **Vote** — Advisory board votes (organizers with 50+ submitted games)
4. **Implementation** — If approved, added to roadmap

### Advisory Board (Future)

Once Mahjic has sufficient adoption, an advisory board will be formed:
- 5-7 members from different regions/leagues
- 2-year rotating terms
- Responsible for major algorithm changes, policy decisions

---

## Why "Mahjic"?

**Mahj** (mahjong) + **Magic** = **Mahjic**

It's memorable, easy to spell, and captures the joy of the game. The "jic" ending also hints at "logic" — the transparent, mathematical foundation of the rating system.

---

## Contact & Contributing

- **Website:** mahjic.org (coming soon)
- **Email:** hello@mahjic.org
- **GitHub:** github.com/mahjic (coming soon)
- **Discord:** (coming soon)

---

*This spec is a living document. Feedback welcome.*

*Last updated: January 2025*
