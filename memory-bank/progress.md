# Progress Tracker

## Completed

### Phase 0: Design (Jan 31, 2026) ✅

- [x] Research chess rating systems (FIDE, Lichess, open source)
- [x] Choose architecture model (Verified Sources as gatekeepers)
- [x] Design player tiers (Provisional vs Verified)
- [x] Design two-rating system (anti-gaming measure)
- [x] Define game data model (rounds, mahjongs, wall_games, points)
- [x] Design API endpoints
- [x] Plan integration methods (API, web form, CSV)
- [x] Define open source strategy
- [x] Create legitimacy framework
- [x] Write full technical spec (SPEC.md)
- [x] Write API reference (API-REFERENCE.md)
- [x] Write landing page copy (LANDING-PAGE-COPY.md)
- [x] Create memory bank

## Next Up

### Phase 1: MVP

- [ ] Secure domain (mahjic.org)
- [ ] Set up GitHub org (github.com/mahjic)
- [ ] Initialize Next.js project
- [ ] Set up Supabase database
- [ ] Create database schema (players, sources, sessions, rounds)
- [ ] Extract ELO algorithm from BAM Good Time
- [ ] Build API endpoints
  - [ ] POST /sessions (submit games)
  - [ ] GET /players/{id}
  - [ ] GET /players/{id}/history
  - [ ] GET /leaderboard
  - [ ] GET /sources
- [ ] Build web form for game submission
- [ ] Build CSV upload for game submission
- [ ] Build player profile pages
- [ ] Build leaderboard page
- [ ] Integrate Stripe Identity for Verified tier
- [ ] Integrate with BAM Good Time (reference implementation)

### Phase 2: Growth

- [ ] Claude-powered Verified Source review agent
- [ ] Python client library
- [ ] JavaScript client library
- [ ] Regional leaderboards
- [ ] Embeddable widgets (rating badge, leaderboard)
- [ ] Player search
- [ ] Rating history charts

### Phase 3: Mobile

- [ ] Design NFC app flow
- [ ] Build mobile app
- [ ] Implement NFC game logging
- [ ] Auto-capture hand types
- [ ] Auto-calculate points
- [ ] Offline sync capability

## Known Issues

None yet - project is in design phase.

## Learnings

### From BAM Good Time
- ELO algorithm already exists at `src/lib/elo.ts`
- K-factor scaling works well (32 → 24 → 16)
- Points bonus ±5 cap prevents score from dominating
- Pairwise comparison handles 4-player games naturally

### From Design Session
- "Verified Sources" better term than "Federations"
- Two-rating system solves anti-gaming elegantly
- Wall games must be tracked separately
- Win rate (mahjongs/games) better than raw mahjong count
- Clubs doing manual review = sales opportunity for BAM Good Time
