# Verification Subscription Design

**Date:** 2026-02-01
**Status:** Approved, ready for implementation

## Overview

Add payment-first verification flow to Mahjic.org. Users pay $20/year, then verify identity via Stripe Identity. 5 attempts included, failed attempts cost $2 each (no refunds for ragequits).

## User Flow

```
/verify page → Pay $20 → Return to /verify → Start Identity Verification → Verified
                                    ↓
                              (up to 5 attempts)
                                    ↓
                              Fail all 5 → Manual process
```

## Policy

### Pricing
- $20/year for verified status
- 5 identity verification attempts included
- Each failed attempt costs Mahjic ~$2 (Stripe Identity fee)

### Refund Policy
- Give up before any attempts → Full refund
- Give up after N attempts → $20 - ($2 × N) refund
- Exhaust all 5 attempts → Manual verification or $10 refund

### Manual Verification (after 5 failed attempts)
Email support@mahjic.org with:
- Photo of ID (front & back)
- Selfie holding ID next to face
- $10 processing fee (Venmo/PayPal)

## Requirements for Users

Prominently displayed before payment:
- Valid government ID (driver's license, passport, or state ID)
- Good lighting - face a window, no backlighting
- Steady hands - prop your phone if needed
- Match your ID - no hats, glasses off, same hair as photo

## Database Schema

### Add to `players` table:
```sql
verification_status TEXT DEFAULT 'none'
  CHECK (verification_status IN ('none', 'paid', 'verified')),
verification_paid_at TIMESTAMPTZ,
verification_attempts INTEGER DEFAULT 0,
verification_checkout_session_id TEXT
```

### Migration for existing data:
```sql
UPDATE players
SET verification_status = 'verified'
WHERE tier = 'verified';
```

## API Endpoints

### `POST /api/verify/checkout`
Creates Stripe Checkout session for $20 payment.

**Validates:**
- User authenticated
- Has player profile
- Not already paid or verified

**Returns:** `{ url: string }` (Checkout URL)

### `POST /api/verify/start-identity`
Creates Stripe Identity session.

**Validates:**
- `verification_status = 'paid'`
- `verification_attempts < 5`

**Actions:**
- Increments `verification_attempts`
- Creates verification_sessions record

**Returns:** `{ url: string }` (Identity verification URL)

### Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` (metadata.type = 'verification_fee') | Set `verification_status = 'paid'`, store checkout session ID |
| `identity.verification_session.verified` | Set `verification_status = 'verified'`, `tier = 'verified'` |
| `identity.verification_session.requires_input` | No DB change (user can retry) |

## UI States

### State: `none` (not paid)
- Benefits list
- Warning box with requirements
- "$20/year - Become Verified" button

### State: `paid` (attempts < 5)
- "Payment Complete" confirmation
- "Attempts remaining: X of 5"
- "Start Identity Verification" button
- Tips reminder

### State: `paid` (attempts = 5)
- "Automatic Verification Failed" message
- Manual verification instructions
- Partial refund option

### State: `verified`
- Success message
- Badge confirmation
- Link to dashboard

## Implementation Order

1. Database migration (add columns, migrate existing)
2. Create Stripe product/price in Dashboard
3. `POST /api/verify/checkout` endpoint
4. Extend webhook handler
5. `POST /api/verify/start-identity` endpoint
6. Update `/verify` page UI
7. Test full flow
8. Cleanup old code

## Environment Variables

```
STRIPE_PRICE_VERIFIED_PLAYER=price_xxx
```

## Files to Modify

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_verification_payment.sql` | CREATE |
| `src/app/api/verify/checkout/route.ts` | CREATE |
| `src/app/api/verify/start-identity/route.ts` | CREATE |
| `src/app/api/webhooks/stripe/route.ts` | MODIFY |
| `src/app/verify/page.tsx` | MODIFY |
| `src/app/verify/verify-form.tsx` | MODIFY |
| `src/lib/stripe.ts` | MODIFY |
| `src/types/index.ts` | MODIFY |
