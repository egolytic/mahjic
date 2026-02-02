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

### Phase 1: MVP (Jan 31, 2026) ✅

- [x] Set up GitHub repo (github.com/egolytic/mahjic)
- [x] Initialize Next.js 16 project with TypeScript + Tailwind
- [x] Set up Supabase database
- [x] Create database schema (8 tables with RLS)
  - players, verified_sources, game_sessions, rounds
  - round_players, rating_history, claim_tokens, source_applications
  - verification_sessions (for Stripe Identity)
- [x] Extract ELO algorithm from BAM Good Time
- [x] Generate Supabase TypeScript types
- [x] Build API endpoints
  - [x] POST /api/v1/sessions (submit games)
  - [x] GET /api/v1/players/[id]
  - [x] GET /api/v1/players/[id]/history
  - [x] GET /api/v1/leaderboard
  - [x] GET /api/v1/sources
  - [x] POST /api/v1/sources/apply
- [x] Build landing page with full copy
- [x] Build player profile pages
- [x] Build leaderboard page
- [x] Build "Become a Source" application page
- [x] Build authentication (Supabase Auth + magic links)
- [x] Build player dashboard
- [x] Build claim profile flow
- [x] Integrate Stripe Identity for Verified tier
- [x] Set up Stripe webhook handler
- [x] Deploy to Vercel (mahjic.vercel.app)
- [x] Configure DNS (mahjic.org → Vercel)
- [x] Apply BAM Good Time brand colors
- [x] Add hummingbird logo
- [x] Register BAM Good Time as Verified Source

### Verification Subscription (Feb 1, 2026) ✅

- [x] Design payment-first verification flow
- [x] Add database columns (verification_status, attempts, etc.)
- [x] Create `/api/verify/checkout` endpoint (Stripe Checkout)
- [x] Create `/api/verify/start-identity` endpoint (Stripe Identity)
- [x] Extend webhook handler for payment completion
- [x] Build multi-state UI on `/verify` page
- [x] Deploy to production

## In Progress

### BAM Good Time Integration

- [x] Create API key for BAM Good Time
- [x] Write integration plan document
- [ ] Implement Mahjic client in BAM Good Time
- [ ] Add Mahjic submission to score actions
- [ ] Test end-to-end flow

## Next Up

### Phase 2: Growth

- [ ] Configure Supabase Auth email templates
- [ ] Add Supabase Auth redirect URL for production
- [ ] Python client library
- [ ] JavaScript client library
- [ ] Regional leaderboards
- [ ] Embeddable widgets (rating badge, leaderboard)
- [ ] Player search
- [ ] Rating history charts
- [ ] Claude-powered Verified Source review agent

### Phase 3: Mobile

- [ ] Design NFC app flow
- [ ] Build mobile app
- [ ] Implement NFC game logging
- [ ] Auto-capture hand types
- [ ] Auto-calculate points
- [ ] Offline sync capability

## Known Issues

1. Next.js 16 middleware deprecation warning (use "proxy" instead)
2. Need to add Supabase Auth redirect URL for production login

## Learnings

### From Build Session
- Parallel subagents dramatically speed up development
- Supabase CLI `db push` handles migrations smoothly
- Vercel CLI can create webhooks and manage env vars
- Stripe CLI provides easy webhook endpoint creation
- BAM Good Time ELO code transferred directly to Mahjic

### From BAM Good Time
- ELO algorithm works well at `src/lib/elo.ts`
- K-factor scaling (32 → 24 → 16) is appropriate
- Points bonus ±5 cap prevents score from dominating
- Pairwise comparison handles 4-player games naturally
