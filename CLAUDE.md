# MAHJIC

**Open rating system for American Mahjong**

---

## SESSION START

```bash
cd ~/Desktop/Mahjic
pnpm dev  # Start dev server at localhost:3000
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
- **Phase:** MVP Complete, Verification Subscription Live
- **Live:** https://mahjic.org
- **GitHub:** https://github.com/egolytic/mahjic

### Key Files
```
src/app/api/v1/           # REST API endpoints
src/app/api/verify/       # Verification endpoints (checkout, start-identity)
src/lib/elo.ts            # Rating algorithm
src/lib/stripe.ts         # Stripe Identity + Checkout
src/lib/supabase/         # Database clients
supabase/migrations/      # Database schema
docs/plans/               # Integration plans
```

### Core Concepts
- **Verified Sources:** Clubs/platforms that can submit games (free to join)
- **Provisional Players:** Created when a source submits a game (free)
- **Verified Players:** $20/year + Stripe Identity, appear on leaderboards
- **Two Ratings:** Mahjic Rating (all games) + Verified Rating (vs verified only)

### Verification Flow (Payment First)
```
Pay $20 → verification_status = "paid"
    ↓
Start Identity (up to 5 attempts) → increments verification_attempts
    ↓
Pass ID check → verification_status = "verified", tier = "verified"
    ↓
Fail 5 times → Manual process (email support@mahjic.org + $10 fee)
```

**Policy:** Each failed attempt costs ~$2 (Stripe Identity fee). No refunds for ragequits.

### API Endpoints
```
POST /api/v1/sessions       # Submit games (requires API key)
GET  /api/v1/players/[id]   # Player profile
GET  /api/v1/leaderboard    # Verified rankings
GET  /api/v1/sources        # List sources
POST /api/verify/checkout   # Start $20 payment
POST /api/verify/start-identity  # Start ID verification (requires payment)
```

### BAM Good Time Integration
```
API Key: mahjic_src_03388fcb2648ff18f33280b7e47e4f1e199832c96ff83621daa7282c6f769ed8
Source ID: 5c1c7973-c840-45da-a0f7-34f39959131d
Plan: docs/plans/2026-01-31-bam-mahjic-integration.md
```

### ELO Algorithm
- Win rate comparison: `mahjongs / games_played`
- Pairwise comparison between all tablemates
- K-factor: 32 (new) → 24 (mid) → 16 (experienced)
- Points bonus: ±5 cap for league/tournament

### Validation Rule
```
sum(all mahjongs) + wall_games = games_played
```

---

## TECH STACK

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | Next.js 16 | ✅ |
| Database | Supabase | ✅ 9 tables |
| Hosting | Vercel | ✅ mahjic.org |
| Identity | Stripe Identity | ✅ |
| Auth | Supabase Auth | ✅ magic links |

---

## DATABASE TABLES

| Table | Purpose |
|-------|---------|
| `players` | Accounts, ratings, tier |
| `verified_sources` | Clubs that submit games |
| `game_sessions` | Container for games |
| `rounds` | Same 4 people playing |
| `round_players` | Individual results |
| `rating_history` | Rating over time |
| `claim_tokens` | Profile claiming |
| `source_applications` | Pending applications |
| `verification_sessions` | Stripe Identity |

---

## ENVIRONMENT VARIABLES

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nevmbqdvivaqwvuzfrrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=https://mahjic.org
```

---

## RELATED PROJECT

**BAM Good Time:** `/Users/sterlinglcannon/Desktop/Bam Good Time/bam-good-time`
- Reference implementation, Verified Source #1
- Shares ELO algorithm and brand colors
- Integration plan in `docs/plans/`

---

## COMMANDS

```bash
pnpm dev              # Dev server
pnpm build            # Production build
supabase db push      # Push migrations
supabase config push  # Push auth config (redirects, etc.)
vercel --prod         # Deploy to production
```

---

## SUPABASE AUTH CONFIG

Auth redirects are configured in `supabase/config.toml`:

```toml
[auth]
site_url = "https://mahjic.org"
additional_redirect_urls = ["https://mahjic.org", "https://mahjic.org/**", "http://127.0.0.1:3000", "http://localhost:3000"]
```

After changing, push with: `supabase config push --project-ref nevmbqdvivaqwvuzfrrn`
