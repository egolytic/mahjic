# MAHJIC

**Open rating system for American Mahjong**

> **Part of the Mahjic Ecosystem** - See `~/Desktop/MAHJIC-ECOSYSTEM.md` for cross-project architecture

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
src/lib/email.ts          # Resend transactional emails
src/lib/supabase/         # Database clients
supabase/migrations/      # Database schema
docs/plans/               # Integration plans
```

### Core Concepts
- **Verified Sources:** Clubs/platforms that can submit games (free to join)
- **Provisional Players:** Created when a source submits a game (free)
- **Verified Players:** $20/year + Stripe Identity, appear on leaderboards
- **Two Ratings:** Mahjic Rating (all games) + Verified Rating (vs verified only)

### Verification Flow (Yearly Subscription)

**New Users (no player profile yet):**
```
Sign up → Subscribe $20/year → Player profile auto-created (1500 rating)
    ↓
Start Identity → Pass → verification_status = "verified", tier = "verified"
    ↓
Ready to play in tournaments requiring verification
    ↓
Auto-renews yearly (webhooks handle status updates)
```

**Existing Players:**
```
Play at club → Claim profile → Subscribe $20/year → Start Identity → Verified
```

**Stripe Configuration (Live Mode):**
```
Product ID: prod_TuYdoDL4rmjuL2
Price ID: price_1SwjWPCy5VSUqVRV7aLaOeEh
Lookup Key: mahjic_verified_yearly
Webhook: https://mahjic.org/api/webhooks/stripe
```

**Subscription Webhook Events:**
- `checkout.session.completed` - Initial subscription
- `customer.subscription.updated` - Status changes
- `customer.subscription.deleted` - Cancellation
- `invoice.paid` - Yearly renewal
- `invoice.payment_failed` - Payment issues

**Identity Verification:**
- 5 attempts included
- Each failed attempt costs ~$2 (Stripe Identity fee)
- Fail 5 times → Manual process (email support@mahjic.org + $10 fee)

**Subscription Status Values:**
- `none` - No subscription
- `active` - Current, paid
- `past_due` - Payment failed, grace period
- `canceled` - User canceled or didn't renew

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

### UUID-Based Identity Linking (Feb 2026)

BGT now sends `bgt_user_id` (auth.users.id UUID) with score submissions instead of relying on email matching.

**How it works:**
1. Session submissions can include `bgt_user_id` per player
2. Lookup order: UUID first → email fallback → create new player
3. Auto-linking: If player found by email but has no UUID, we link them
4. Response includes `bgt_user_id` for result mapping

**Database:**
- `players.bgt_user_id` - UUID column linking to BGT auth.users.id
- Unique constraint ensures one BGT user per Mahjic player

**Backward Compatible:** Email-only submissions still work.

**Key files:**
- `src/app/api/v1/sessions/route.ts` - Three-step player lookup
- `src/lib/api/validation.ts` - bgt_user_id in schema
- `supabase/migrations/20260203100000_add_bgt_user_id.sql`

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
| Email | Resend | ✅ transactional |

---

## DATABASE TABLES

| Table | Purpose |
|-------|---------|
| `players` | Accounts, ratings, tier, verification status |
| `verified_sources` | Clubs that submit games |
| `events` | Game sessions (shared with BGT) |
| `rounds` | Same 4 people playing |
| `round_players` | Individual results |
| `rating_history` | Rating over time |
| `claim_tokens` | Profile claiming |
| `source_applications` | Pending applications |
| `verification_sessions` | Stripe Identity |

---

## ENVIRONMENT VARIABLES

```bash
# Supabase (shared with BGT - Feb 2026)
NEXT_PUBLIC_SUPABASE_URL=https://yeyhwsrlnvbvzrwqbqku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Stripe - LIVE MODE (switched Feb 2, 2026)
STRIPE_SECRET_KEY=sk_live_...  # Live mode - real charges!
STRIPE_WEBHOOK_SECRET=whsec_... # Must be live webhook for mahjic.org

# Resend (email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@mail.bamgoodtime.com

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

## Unified Supabase Architecture (Feb 3, 2026) ✅

**Architecture:** All three Mahjic ecosystem projects share BGT's Supabase (`yeyhwsrlnvbvzrwqbqku.supabase.co`).

```
BGT (Web)                Mahjic App (Mobile)          Mahjic.org (Ratings)
    │                          │                           │
    └──────────┬───────────────┘                           │
               │                                           │
               ▼                                           │
         BGT Supabase ◄────────────────────────────────────┘
     (yeyhwsrlnvbvzrwqbqku)                    (API submissions)
```

**Backup:** Original Supabase config saved as `.env.backup.mahjic-supabase`

**What changed:**
- `game_sessions` table → `events` table (with external org for API submissions)
- Sessions API writes to `events` with `org_id = '00000000-0000-0000-0000-000000000001'` (external org)
- Same `players`, `rounds`, `round_players`, `rating_history` tables
- Same auth system as BGT and Mahjic App

**Key tables:**
- `players` - Global player profiles with `mahjic_rating`, `verified_rating`, verification status
- `verified_sources` - Approved clubs/platforms that can submit game results
- `rounds` - Game rounds within events
- `round_players` - Per-player per-round results with rating tracking
- `rating_history` - Historical rating changes for audit trail
- `events` - Shared events table (BGT club events + Mahjic API submissions)

**External Org for API Submissions:**
```typescript
const EXTERNAL_ORG_ID = '00000000-0000-0000-0000-000000000001';
// Use this when submitting games via Mahjic API (no club association)
```

---

## COMMANDS

```bash
pnpm dev              # Dev server
pnpm build            # Production build
supabase db push      # Push migrations
supabase config push  # Push auth config (redirects, etc.)
vercel --prod         # Deploy to production

# Environment variable management
./scripts/sync-env.sh .env.local production    # Sync env vars to Vercel (safe, no trailing newlines)
./scripts/validate-env.sh production           # Validate env vars are clean and complete
```

### Env Var Scripts

**IMPORTANT:** Always use `./scripts/sync-env.sh` to upload env vars to Vercel. Copy/paste in the Vercel dashboard can introduce trailing newlines that break the app.

| Script | Purpose |
|--------|---------|
| `sync-env.sh` | Uses `printf` to upload env vars without trailing newlines |
| `validate-env.sh` | Checks for whitespace issues, validates required vars, and ensures production doesn't use localhost |

### Critical Env Var: NEXT_PUBLIC_APP_URL

**MUST be different for local vs production:**
- **Local (.env.local):** `http://localhost:3000`
- **Production (Vercel):** `https://mahjic.org`

If production uses localhost, Stripe checkout redirects will fail silently. The validate script now catches this.

---

## SUPABASE AUTH CONFIG

Auth redirects are configured in `supabase/config.toml`:

```toml
[auth]
site_url = "https://mahjic.org"
additional_redirect_urls = ["https://mahjic.org", "https://mahjic.org/**", "http://127.0.0.1:3000", "http://localhost:3000"]
```

After changing, push with: `supabase config push --project-ref nevmbqdvivaqwvuzfrrn`

---

## EMAIL SERVICE

**Provider:** Resend (resend.com)
**Domain:** mail.bamgoodtime.com (uses BAM Good Time domain for unified branding)
**From:** `Mahjic by Bam Good Time <hello@mail.bamgoodtime.com>`

### Implementation
- `src/lib/email.ts` - Resend client and email templates
- Uses BAM Good Time brand colors (green-deep #4a8f53, coral #fd5d9d, cream #fdfaf6)
- Triggered from Stripe webhook on successful payment

### Current Emails
| Email | Trigger | Purpose |
|-------|---------|---------|
| Verification Welcome | `checkout.session.completed` | Welcome + invoice for trademark evidence |

### Environment Variables
```bash
RESEND_API_KEY=re_...                          # Resend API key
RESEND_FROM_EMAIL=hello@mail.bamgoodtime.com   # Sender address
```
