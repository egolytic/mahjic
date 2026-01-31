# Mahjic

**The open rating system for American Mahjong.**

Play anywhere. Take your rating everywhere.

---

## What's in this folder

| File | Description |
|------|-------------|
| `SPEC.md` | Full technical specification — algorithm, data model, API, roadmap |
| `LANDING-PAGE-COPY.md` | Website copy for mahjic.org |
| `API-REFERENCE.md` | Quick API reference for developers |
| `README.md` | This file |

---

## Quick Links

- **Domain:** mahjic.org
- **Tech stack:** Next.js, Supabase, Vercel (recommended)
- **Rating algorithm:** ELO with pairwise comparison + points weighting
- **Reference implementation:** BAM Good Time

---

## Core Concepts

### Verified Sources
Clubs, platforms, and leagues that are authorized to submit game results. Only games from Verified Sources count toward ratings. Free to join.

### Player Tiers
- **Provisional:** Created when a Verified Source submits a game with you. Free. Can view rating but not on leaderboards.
- **Verified:** $20/year + Stripe Identity check. Appears on leaderboards with verified badge.

### Two Ratings
- **Mahjic Rating:** All games you've played
- **Verified Rating:** Only games against Verified players (used for leaderboards)

### Game Model
```
Round = Same 4 people playing X games together
├── games_played: How many games in the round
├── mahjongs: How many games each player won
├── wall_games: Games where nobody won
└── points: Optional, for league/tournament scoring
```

---

## Next Steps

1. [x] Secure domain (mahjic.org)
2. [ ] Set up GitHub org (github.com/mahjic)
3. [ ] Build MVP website with player profiles
4. [ ] Implement ELO algorithm (extract from BAM Good Time)
5. [ ] Create API for Verified Sources
6. [ ] Integrate with BAM Good Time (reference implementation)
7. [ ] Recruit beta Verified Sources

---

## Why This Exists

To prevent any single organization from locking up Mahjong ratings as a proprietary product.

Some organizations want to create closed rating systems where you can only get rated by playing their events. That's gatekeeping.

Mahjic is the open alternative: play anywhere, submit through any Verified Source, own your rating forever.

---

*Created: January 2025*
*Updated: January 2026*
