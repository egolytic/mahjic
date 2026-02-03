import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Verification subscription: $20/year
 * Created via Stripe API - lookup_key for price lookup
 */
export const VERIFICATION_PRICE_LOOKUP_KEY = 'mahjic_verified_yearly';
export const VERIFICATION_PRICE_ID = 'price_1SwjWPCy5VSUqVRV7aLaOeEh';

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
 * Create a Checkout Session for the $20/year verification subscription.
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
  // Check if customer already exists
  const existingCustomers = await stripe.customers.list({
    email: customerEmail,
    limit: 1,
  });

  const customerOptions: { customer?: string; customer_email?: string } = {};
  if (existingCustomers.data.length > 0) {
    customerOptions.customer = existingCustomers.data[0].id;
  } else {
    customerOptions.customer_email = customerEmail;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ...customerOptions,
    line_items: [
      {
        price: VERIFICATION_PRICE_ID,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        player_id: playerId,
        user_id: userId,
        type: 'verification_subscription',
      },
    },
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

/**
 * Create a Billing Portal session for subscription management.
 */
export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}
