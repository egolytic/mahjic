import { stripe } from "@/lib/stripe";
import { sendVerificationWelcomeEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Stripe from "stripe";

/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhooks for:
 * - identity.verification_session.verified - Player passed ID verification
 * - identity.verification_session.requires_input - Verification needs more info
 * - checkout.session.completed - Payment for verification fee completed
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      // In development, skip signature verification
      console.warn("STRIPE_WEBHOOK_SECRET not set, skipping signature verification");
      event = JSON.parse(body) as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "identity.verification_session.verified": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        const playerId = session.metadata?.player_id;

        if (!playerId) {
          console.error("No player_id in verification session metadata");
          break;
        }

        console.log(`Verification successful for player ${playerId}`);

        // Update verification session status
        await supabase
          .from("verification_sessions")
          .update({ status: "verified", verified_at: new Date().toISOString() })
          .eq("stripe_session_id", session.id);

        // Update player to verified tier and status
        await supabase
          .from("players")
          .update({
            tier: "verified",
            verification_status: "verified",
            verified_at: new Date().toISOString(),
          })
          .eq("id", playerId);

        break;
      }

      case "identity.verification_session.requires_input": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        const playerId = session.metadata?.player_id;

        console.log(`Verification requires input for player ${playerId}`);

        // Update session status
        await supabase
          .from("verification_sessions")
          .update({ status: "requires_input" })
          .eq("stripe_session_id", session.id);

        break;
      }

      case "identity.verification_session.canceled": {
        const session = event.data.object as Stripe.Identity.VerificationSession;

        await supabase
          .from("verification_sessions")
          .update({ status: "canceled" })
          .eq("stripe_session_id", session.id);

        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.type === "verification_fee") {
          const playerId = session.metadata?.player_id;

          console.log(`Verification payment completed for player ${playerId}`);

          // Update player: set payment status, store customer ID and checkout session ID
          const updateData: Record<string, unknown> = {
            verification_status: "paid",
            verification_paid_at: new Date().toISOString(),
            verification_checkout_session_id: session.id,
          };

          if (session.customer) {
            updateData.stripe_customer_id = session.customer as string;
          }

          await supabase
            .from("players")
            .update(updateData)
            .eq("id", playerId);

          // Send welcome/invoice email
          if (session.customer_email) {
            const transactionDate = new Date();
            const expiresDate = new Date();
            expiresDate.setFullYear(expiresDate.getFullYear() + 1);

            // Get player name for the email
            const { data: player } = await supabase
              .from("players")
              .select("display_name")
              .eq("id", playerId)
              .single();

            const customerName = player?.display_name || "Mahjic Player";

            try {
              await sendVerificationWelcomeEmail({
                to: session.customer_email,
                customerName,
                transactionId: session.id,
                transactionDate,
                expiresDate,
              });
            } catch (emailError) {
              // Log but don't fail the webhook - payment was successful
              console.error("Failed to send welcome email:", emailError);
            }
          }
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
