import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Verification price: $20/year
 */
export const VERIFICATION_PRICE_CENTS = 2000;

/**
 * Create a Stripe Identity verification session for a player.
 */
export async function createVerificationSession({
  playerId,
  userId,
  returnUrl,
}: {
  playerId: string;
  userId: string;
  returnUrl: string;
}) {
  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: {
      player_id: playerId,
      user_id: userId,
    },
    options: {
      document: {
        allowed_types: ['driving_license', 'passport', 'id_card'],
        require_id_number: false,
        require_live_capture: true,
        require_matching_selfie: true,
      },
    },
    return_url: returnUrl,
  });

  return session;
}

/**
 * Retrieve a verification session by ID.
 */
export async function getVerificationSession(sessionId: string) {
  return stripe.identity.verificationSessions.retrieve(sessionId);
}

/**
 * Create a Checkout Session for the $20/year verification fee.
 */
export async function createCheckoutSession({
  playerId,
  userId,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  playerId: string;
  userId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Mahjic Verified Player',
            description: 'Annual verified player status with leaderboard access',
          },
          unit_amount: VERIFICATION_PRICE_CENTS,
        },
        quantity: 1,
      },
    ],
    metadata: {
      player_id: playerId,
      user_id: userId,
      type: 'verification_fee',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}
