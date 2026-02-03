# Active Context

## Current State

**Phase:** MVP Complete, Yearly Subscription Model Live

The Mahjic rating system is fully built with Stripe Identity + yearly subscription verification.

## What Was Just Done (Feb 3, 2026)

### Stripe Identity Enabled for Live Mode
1. **Root cause found** - Identity wasn't activated for live mode (only test mode worked)
2. **Fixed** - Enabled Stripe Identity via dashboard application
3. **Features enabled** - Document verification, synthetic identity protection, mobile SDK

### Converted to Yearly Subscription Model
1. **Stripe Product created** - `prod_TuYdoDL4rmjuL2` (Mahjic Verified Player)
2. **Stripe Price created** - `price_1SwjWPCy5VSUqVRV7aLaOeEh` ($20/year, lookup key: `mahjic_verified_yearly`)
3. **Checkout mode changed** - From `payment` (one-time) to `subscription` (recurring)
4. **Webhook events added**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid` (yearly renewals)
   - `invoice.payment_failed`
5. **Database migration** - Added `stripe_subscription_id`, `subscription_status` columns
6. **Billing portal** - Added `createBillingPortalSession()` for subscription management

### Code Changes
- `src/lib/stripe.ts` - Subscription checkout, billing portal
- `src/app/api/webhooks/stripe/route.ts` - Subscription lifecycle handlers
- `supabase/migrations/20260203000001_add_subscription_columns.sql`

## What Was Done (Feb 2, 2026)

### Stripe Switched to Live Mode
1. **Secret key updated** - Now using `sk_live_...` instead of `sk_test_...`
2. **Vercel env var updated** - STRIPE_SECRET_KEY changed via CLI with `printf` (no trailing newlines)
3. **Webhook created** - Live mode webhook at `https://mahjic.org/api/webhooks/stripe`
4. **Real charges now active** - $20/year verification subscriptions process real money

### Verification UX Improvements
1. **Homepage CTAs** - Added prominent "Get Verified - $20/year" buttons:
   - Hero section: Primary CTA now for player verification
   - Player Tiers section: Direct "Get Verified" button on Verified card
   - Final CTA: Three buttons - Get Verified, Leaderboard, For Clubs
2. **Dashboard Banner** - Added gold/coral gradient verification CTA for provisional players
3. **New User Flow** - Users can now verify WITHOUT playing first:
   - Previously: Had to play → get profile → then verify (chicken-and-egg problem)
   - Now: Can verify first → profile created automatically → play tournaments
   - Profile created with 1500 starting rating during checkout
4. **BAM Integration Plan** - Added account linking flow documentation

### Verification Flow (Updated)
- **New users**: Sign up → Pay $20 → Profile created automatically → Verify ID → Ready to play
- **Existing players**: Play → Claim profile → Pay $20 → Verify ID → Appear on leaderboards

## What Was Done (Feb 1, 2026)

### Verification Subscription Feature
1. **Payment-first flow** - User pays $20 before identity verification
2. **Attempt tracking** - 5 Stripe Identity attempts included
3. **New API endpoints**:
   - `POST /api/verify/checkout` - Stripe Checkout for $20 payment (now creates player if needed)
   - `POST /api/verify/start-identity` - Stripe Identity (requires payment)
4. **Database columns** added to `players`:
   - `verification_status` (none | paid | verified)
   - `verification_paid_at`, `verification_attempts`, `verification_checkout_session_id`
5. **Multi-state UI** on `/verify` page:
   - Not paid → Payment button + info for new users
   - Paid → Identity verification button + attempts remaining
   - Exhausted → Manual verification instructions
   - Verified → Success confirmation

### Policy
- $20/year for verification
- 5 identity attempts included (~$2/attempt cost to us)
- No refunds for ragequits
- Fail all 5 → Manual process (email + $10 fee)

## What Was Done (Jan 31, 2026)

### Built Complete MVP
1. **Next.js 16 app** with TypeScript, Tailwind, App Router
2. **Supabase database** with 9 tables + RLS policies
3. **Full API** - sessions, players, leaderboard, sources
4. **Authentication** - Supabase Auth with magic links
5. **Stripe Identity** - verification flow for $20/year tier
6. **Deployed** to Vercel with custom domain

### Configured Integration
1. **BAM Good Time registered** as Verified Source #1
2. **API key generated** for BAM to submit games
3. **Integration plan** documented with code examples

## Live URLs

| URL | Purpose |
|-----|---------|
| https://mahjic.org | Production site |
| https://mahjic.vercel.app | Vercel URL |
| https://github.com/egolytic/mahjic | Source code |

## BAM Good Time API Key

```
mahjic_src_03388fcb2648ff18f33280b7e47e4f1e199832c96ff83621daa7282c6f769ed8
```

Store in BAM Good Time as `MAHJIC_API_KEY` environment variable.

## Key Files

```
~/Desktop/Mahjic/
├── src/
│   ├── app/
│   │   ├── api/v1/          # REST API endpoints
│   │   ├── dashboard/       # Player dashboard
│   │   ├── leaderboard/     # Public leaderboard
│   │   ├── players/[id]/    # Player profiles
│   │   ├── verify/          # Stripe Identity flow
│   │   └── page.tsx         # Landing page
│   ├── components/          # UI components
│   ├── lib/
│   │   ├── elo.ts           # Rating algorithm
│   │   ├── stripe.ts        # Stripe Identity
│   │   └── supabase/        # Database clients
│   └── types/               # TypeScript types
├── supabase/migrations/     # Database schema
├── docs/plans/              # Integration plans
└── .env.local               # Environment variables
```

## Current Focus

**BAM Good Time Integration** - Need to implement the other side:
1. Create Mahjic client library in BAM
2. Modify score submission to call Mahjic API
3. Test end-to-end flow

## Environment Variables (Vercel)

All configured:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

## Open Tasks

1. **BAM Integration** - Implement client library
2. **Email Templates** - Configure Supabase Auth emails

## Recently Fixed

- **Supabase Auth redirect** - Fixed config to redirect to mahjic.org instead of localhost
  - Updated `supabase/config.toml` with `site_url = "https://mahjic.org"`
  - Pushed config with `supabase config push`
