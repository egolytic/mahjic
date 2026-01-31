# Active Context

## Current State

**Phase:** MVP Complete, Integration In Progress

The Mahjic rating system is fully built and deployed. Now integrating with BAM Good Time.

## What Was Just Done (Jan 31, 2026)

### Built Complete MVP
1. **Next.js 16 app** with TypeScript, Tailwind, App Router
2. **Supabase database** with 8 tables + RLS policies
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

1. **Supabase Auth** - Add redirect URL for production login
2. **BAM Integration** - Implement client library
3. **Email Templates** - Configure Supabase Auth emails
