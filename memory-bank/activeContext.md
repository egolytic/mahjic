# Active Context

## Current State

**Phase:** MVP Complete, Verification Subscription Live

The Mahjic rating system is fully built and deployed with payment-first verification flow.

## What Was Just Done (Feb 1, 2026)

### Verification Subscription Feature
1. **Payment-first flow** - User pays $20 before identity verification
2. **Attempt tracking** - 5 Stripe Identity attempts included
3. **New API endpoints**:
   - `POST /api/verify/checkout` - Stripe Checkout for $20 payment
   - `POST /api/verify/start-identity` - Stripe Identity (requires payment)
4. **Database columns** added to `players`:
   - `verification_status` (none | paid | verified)
   - `verification_paid_at`, `verification_attempts`, `verification_checkout_session_id`
5. **Multi-state UI** on `/verify` page:
   - Not paid → Payment button + warning about $2/attempt cost
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
