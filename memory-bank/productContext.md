# Product Context

## Core Concepts

### Verified Sources
Clubs, platforms, and leagues authorized to submit game results. Only games from Verified Sources count toward ratings.

**Types:**
- **Platforms** (API integration) → BAM Good Time, future apps
- **Clubs** (web form/CSV) → Local Mahjong clubs
- **Leagues** (CSV upload) → Tournament organizers

**Onboarding:** Free, manual review (Claude agent later as volume grows)

### Player Tiers

| Tier | How to Get | Features | Cost |
|------|------------|----------|------|
| **Provisional** | Verified Source submits a game with you | Rating, history, NOT on leaderboards | Free |
| **Verified** | Pay + Stripe Identity check | Leaderboards, verified badge, ID confirmed | $20/year |

### Two Rating System

| Rating Type | Games Counted | Used For |
|-------------|---------------|----------|
| **Mahjic Rating** | All games | Personal tracking |
| **Verified Rating** | Only vs Verified players | Leaderboards, official rankings |

**Why two?** Prevents gaming via fake provisional accounts. Leaderboard only counts games against ID-verified players.

### Privacy Options

| Mode | Identifier | Description |
|------|------------|-------------|
| **Normal** | `alice@example.com` | Full participation, public profile |
| **Private** | `PRIVATE:alice@example.com` | Rated but hidden from search/leaderboards |
| **Anonymous** | `ANON:PlayerNick` | Local to one source, no Mahjic ID |

## Game Submission

### Data Model
```
Session
├── source_id
├── session_date
├── game_type (social | league | tournament)
└── rounds[]
    ├── players[]
    │   ├── email
    │   ├── games_played
    │   ├── mahjongs
    │   └── points (league/tournament only)
    └── wall_games
```

### Validation
- `sum(all mahjongs) + wall_games = games_played`
- All players in round have same `games_played`
- `points` required for league/tournament, ignored for social

### Game Types

| Type | Points? | Use Case |
|------|---------|----------|
| **Social** | No | Casual nights, just counting mahjongs |
| **League** | Yes | Regular season with scoring |
| **Tournament** | Yes | Competitive events |

### Special Cases
- **Siamese (2 players):** Submit round with 2 players
- **"Bob" (imaginary):** Use `bob@mahjic.org` - fixed 1500 rating
- **League night:** 2 rounds with different opponents each

## Integration Methods

1. **REST API** → For platforms (BAM Good Time, future apps)
2. **Web Form** → For small clubs (manual entry)
3. **CSV/Excel Upload** → For leagues with existing spreadsheets

## Future Vision

### Phase 3: Mobile NFC App
- Players tap phones after each game
- Auto-capture hand type (concealed, row, etc.)
- Points calculated automatically
- Clubs don't track anything - it just happens
