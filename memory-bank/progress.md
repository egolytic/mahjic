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
- [x] Fix Supabase Auth redirect URL for production login
- [x] Test end-to-end verification flow in browser

### Verification UX Improvements (Feb 2, 2026) ✅

- [x] Add prominent "Get Verified" CTAs to homepage
- [x] Add verification banner to dashboard for provisional players
- [x] Allow new users to verify without existing player profile
- [x] Auto-create player profile during checkout (1500 starting rating)
- [x] Update BAM integration plan with account linking flow
- [x] Deploy to production

### Email Service (Feb 2, 2026) ✅

- [x] Add Resend for transactional emails
- [x] Create verification welcome email with invoice details
- [x] Integrate with Stripe webhook (checkout.session.completed)
- [x] Use BAM Good Time branding (green-deep, coral, cream)
- [x] Send from hello@mail.bamgoodtime.com domain
- [x] Include invoice details for trademark filing evidence

### Environment Variable Management (Feb 2, 2026) ✅

- [x] Create `scripts/sync-env.sh` - Safe env var upload using printf (no trailing newlines)
- [x] Create `scripts/validate-env.sh` - Validate env vars have no whitespace issues
- [x] Fixed 6 existing Vercel env vars that had trailing newline characters
- [x] Added RESEND_API_KEY and RESEND_FROM_EMAIL to Vercel production
- [x] Redeployed to production with clean env vars

### Verification Flow Bug Fixes (Feb 2, 2026) ✅

- [x] Fixed player profile creation error (removed non-existent `mahjongs`/`wall_games` columns)
- [x] Fixed duplicate player creation on retry (use admin client to check existing player)
- [x] Fixed NEXT_PUBLIC_APP_URL in production (was localhost, now https://mahjic.org)
- [x] Fixed RLS policy on players table (was checking wrong column for user ownership)
- [x] Updated validate-env.sh to catch localhost in production
- [x] Full verification flow tested end-to-end: signup → pay → email received → identity verification ready

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

### Vercel Env Var Issues
- Copy/paste in Vercel dashboard can introduce trailing newlines
- Trailing newlines cause runtime errors (env vars don't match expected values)
- Use `printf '%s' "$value" | vercel env add` to avoid trailing newlines
- Always validate env vars after upload with `./scripts/validate-env.sh`
- **CRITICAL:** NEXT_PUBLIC_APP_URL must be `https://mahjic.org` in production, not localhost
- Stripe checkout redirect URLs use this var - wrong value = silent redirect failures

### Supabase RLS Policies
- RLS policies must match the column being queried (auth_user_id, not id)
- When users can't see their own data, check RLS first
- Admin client bypasses RLS - useful for debugging
- Policy `auth.uid() = auth_user_id` lets users read their own player profile
