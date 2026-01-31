# MAHJIC

**Open rating system for American Mahjong**

---

## SESSION START

```bash
cd ~/Desktop/Mahjic
```

---

## MEMORY BANK

@import memory-bank/systemPatterns.md
@import memory-bank/activeContext.md
@import memory-bank/techContext.md
@import memory-bank/productContext.md
@import memory-bank/projectbrief.md
@import memory-bank/progress.md

---

## QUICK REFERENCE

### Project Status
- **Phase:** Design Complete, Ready to Build
- **Code:** None yet - spec only

### Key Files
```
SPEC.md              # Full technical specification
API-REFERENCE.md     # API documentation
LANDING-PAGE-COPY.md # Website copy
README.md            # Project overview
memory-bank/         # Persistent context (READ THIS)
```

### Core Concepts
- **Verified Sources:** Clubs/platforms that can submit games (free to join)
- **Provisional Players:** Created when a source submits a game (free)
- **Verified Players:** $20/year + Stripe Identity, appear on leaderboards
- **Two Ratings:** Mahjic Rating (all games) + Verified Rating (vs verified only)

### Game Data Model
```
Round = Same 4 people playing X games
├── games_played: Number of games in round
├── mahjongs: Games won per player
├── wall_games: Games with no winner
└── points: Optional, for league/tournament
```

### Validation Rule
```
sum(all mahjongs) + wall_games = games_played
```

### ELO Algorithm
- Win rate comparison: `mahjongs / games_played`
- Pairwise comparison between all tablemates
- K-factor: 32 (new) → 24 (mid) → 16 (experienced)
- Points bonus: ±5 cap for league/tournament

### Related Project
- **BAM Good Time:** Reference implementation, Verified Source #1
- ELO code exists at: `~/Desktop/Bam Good Time/bam-good-time/src/lib/elo.ts`

---

## PLANNED TECH STACK

| Layer | Technology |
|-------|------------|
| Frontend | Next.js |
| Database | Supabase |
| Hosting | Vercel |
| Identity | Stripe Identity |
| Email | Resend |

---

## AFTER COMMITS

Run `/workflow:update-memory` to save learnings for future sessions.
