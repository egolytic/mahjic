# Mahjic - Project Brief

## What This Is

An **open rating system** for American Mahjong.

- **Central hub** (`mahjic.org`) → Player profiles, ratings, leaderboards, game history
- **Verified Sources** → Clubs, leagues, and platforms that submit game results
- **Open source algorithm** → Transparent, auditable, community-trusted

## Mission

Prevent any single organization from locking up Mahjong ratings as a proprietary product. Play anywhere, take your rating everywhere.

## Competitive Positioning

| Closed Systems | Mahjic |
|----------------|--------|
| Play OUR events only | Play anywhere |
| Ratings locked to their platform | Ratings travel with YOU |
| Black box algorithm | Open source, auditable |
| Pay to participate | Free for clubs |

## Business Model

| Revenue Stream | Price | Description |
|----------------|-------|-------------|
| Verified Player | $20/year | ID verification via Stripe Identity, leaderboard access |
| Verified Sources | Free | Clubs/platforms submit games for free (growth strategy) |

## Core User Flows

1. **Verified Source Onboarding:** Apply → Manual review → Approved → Get API key/credentials
2. **Player Creation:** Verified Source submits game → Player record created → Email sent to claim profile
3. **Game Submission:** Source submits round data → Mahjic calculates ELO → Returns updated ratings
4. **Player Verification:** Pay $20 → Stripe Identity check → Verified badge + leaderboard access

## Key URLs

- Production: https://mahjic.org (planned)
- GitHub: https://github.com/mahjic (planned)
- Reference implementation: BAM Good Time

## Relationship to BAM Good Time

- BAM Good Time will be Verified Source #1
- Mahjic.org is a separate project, not part of BAM Good Time
- The ELO algorithm in BAM Good Time (`src/lib/elo.ts`) will be extracted/adapted for Mahjic
- When manually reviewing Verified Source applications, opportunity to pitch BAM Good Time platform
