# Active Context

## Current State

**Phase:** Design Complete, Ready to Build

The full design spec has been created and documented. No code has been written yet.

## What Was Just Done (Jan 31, 2026)

Completed comprehensive brainstorming session to design the Mahjic rating system:

1. **Researched chess rating systems** (FIDE, Lichess, open source ELO)
2. **Chose architecture model** - Hybrid with Verified Sources as gatekeepers
3. **Designed player tiers** - Provisional (free) vs Verified ($20/year + Stripe ID)
4. **Designed two-rating system** - Overall + Verified-only for leaderboards
5. **Refined game data model** - Rounds with mahjongs, games_played, wall_games, points
6. **Designed API** - Sessions endpoint, player profiles, leaderboards
7. **Planned integration methods** - API, web form, CSV upload
8. **Defined open source strategy** - Algorithm open, platform private
9. **Created legitimacy framework** - How to defend against closed systems

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Algorithm | ELO (not Glicko-2) | Simpler, already built in BAM Good Time |
| Comparison metric | Win rate (mahjongs/games) | Handles variable game counts |
| Player registration | Via Verified Sources | Clubs are gatekeepers, not self-signup |
| Leaderboard anti-gaming | Two ratings | Verified Rating only counts vs verified players |
| Verified Source cost | Free | Maximize adoption, it's a sales funnel |
| Verified Player cost | $20/year | Covers Stripe Identity costs |

## Files Updated

```
~/Desktop/Mahjic/
├── README.md           ✅ Updated
├── SPEC.md             ✅ Complete technical spec
├── API-REFERENCE.md    ✅ API documentation
├── LANDING-PAGE-COPY.md ✅ Website copy
└── memory-bank/        ✅ Created
    ├── projectbrief.md
    ├── productContext.md
    ├── techContext.md
    ├── systemPatterns.md
    ├── activeContext.md
    └── progress.md
```

## Current Focus

Waiting for decision on next steps:
- Build MVP?
- Set up project structure?
- Future project (spec is enough for now)?

## Open Questions

1. When to start building?
2. Should it be a monorepo with BAM Good Time or separate?
3. Domain setup (mahjic.org DNS, hosting)?
4. GitHub organization setup?
