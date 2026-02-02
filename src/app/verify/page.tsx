import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";
import { VerifyForm } from "./verify-form";

export const metadata = {
  title: "Verify Your Identity | Mahjic",
  description: "Upgrade to a verified Mahjic account",
};

const MAX_VERIFICATION_ATTEMPTS = 5;

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; identity?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?redirect=/verify");
  }

  // Get player data
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  // Check if already verified
  if (player?.tier === "verified" || player?.verification_status === "verified") {
    return (
      <div className="min-h-screen bg-cream">
        <header className="border-b border-green/10 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="text-xl font-display font-bold text-green-deep"
            >
              Mahjic
            </Link>
            <UserMenu user={user} />
          </div>
        </header>

        <main className="mx-auto max-w-xl px-4 py-12">
          <div className="rounded-2xl border border-green/20 bg-green/10 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green/20">
              <svg
                className="h-6 w-6 text-green-deep"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="font-display text-xl font-semibold text-green-deep">
              You&apos;re Verified!
            </h1>
            <p className="mt-2 text-text-light">
              Your account is verified. You appear on leaderboards and
              have a verified badge.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-coral px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coral-hover"
            >
              Go to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Check if payment was just completed
  const paymentSuccess = params.payment === "success";
  const paymentCanceled = params.payment === "canceled";
  const identityComplete = params.identity === "complete";

  // Check if attempts exhausted
  const attemptsExhausted = (player?.verification_attempts || 0) >= MAX_VERIFICATION_ATTEMPTS;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-green/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-xl font-display font-bold text-green-deep"
          >
            Mahjic
          </Link>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-2xl border border-green/10 bg-white p-8 shadow-sm">

          {/* Success/Error messages from URL params */}
          {paymentSuccess && (
            <div className="mb-6 rounded-lg border border-green/30 bg-green/10 p-4 text-sm text-green-deep">
              <strong>Payment successful!</strong> Now complete identity verification below.
            </div>
          )}

          {paymentCanceled && (
            <div className="mb-6 rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm text-gold-hover">
              Payment was canceled. You can try again when ready.
            </div>
          )}

          {identityComplete && player?.verification_status === "paid" && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              Verification submitted! We&apos;re processing your ID. This usually takes a few seconds.
              <Link
                href="/verify"
                className="ml-2 underline hover:no-underline"
              >
                Refresh
              </Link>
            </div>
          )}

          {/* Exhausted attempts state */}
          {attemptsExhausted && player?.verification_status === "paid" ? (
            <>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="font-display text-2xl font-bold text-text">
                Automatic Verification Failed
              </h1>
              <p className="mt-2 text-text-light">
                You&apos;ve used all 5 verification attempts.
              </p>

              <div className="mt-6 rounded-xl border border-gold/20 bg-gold/10 p-4">
                <h2 className="font-display font-semibold text-text">
                  Manual Verification Required
                </h2>
                <p className="mt-2 text-sm text-text-light">
                  Email <a href="mailto:support@mahjic.org" className="text-coral underline">support@mahjic.org</a> with:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-text-light">
                  <li>• Photo of ID (front & back)</li>
                  <li>• Selfie holding ID next to your face</li>
                  <li>• $10 processing fee (Venmo/PayPal)</li>
                </ul>
                <p className="mt-3 text-sm text-text-light">
                  Or request a partial refund ($10 - we absorbed $10 in verification costs).
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-text">
                {player?.verification_status === "paid" ? "Complete Verification" : "Become Verified"}
              </h1>
              <p className="mt-2 text-text-light">
                {player?.verification_status === "paid"
                  ? "Payment complete! Now verify your identity."
                  : "Verify your identity to unlock all Mahjic features"
                }
              </p>

              {/* Benefits - only show if not yet paid */}
              {player?.verification_status !== "paid" && (
                <div className="mt-6 space-y-4">
                  <h2 className="section-label">
                    Verified Benefits
                  </h2>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-deep"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-text-light">
                        <strong className="text-text">Appear on Leaderboards</strong> - Compete for regional
                        and global rankings
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-deep"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-text-light">
                        <strong className="text-text">Verified Badge</strong> - Show others your identity is
                        confirmed
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-deep"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-text-light">
                        <strong className="text-text">Verified Rating</strong> - Get a separate rating based
                        on games vs other verified players
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-deep"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-text-light">
                        <strong className="text-text">Anti-Fraud Protection</strong> - ID verification
                        prevents fake accounts from gaming the system
                      </span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Warning box - only show before payment */}
              {player?.verification_status !== "paid" && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                  <h3 className="font-display font-semibold text-red-700">
                    Before You Pay - Read This
                  </h3>
                  <p className="mt-2 text-sm text-red-600">
                    You&apos;ll verify your identity via Stripe. You get <strong>5 attempts</strong>.
                    Each failed attempt costs us $2, so no refunds for ragequits.
                  </p>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-700">What you need:</p>
                    <ul className="mt-1 space-y-1 text-sm text-red-600">
                      <li>• Government ID (driver&apos;s license, passport, or state ID)</li>
                      <li>• Good lighting - face a window, no backlighting</li>
                      <li>• Steady hands - prop your phone if needed</li>
                      <li>• Match your ID - no hats, glasses off, same hair as photo</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Pricing - only show before payment */}
              {player?.verification_status !== "paid" && (
                <div className="mt-6 rounded-xl bg-gold/10 p-4 border border-gold/20">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-lg font-semibold text-text">
                      Annual Verification
                    </span>
                    <span className="font-display text-2xl font-bold text-gold">
                      $20
                      <span className="text-sm font-normal text-text-light">/year</span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-light">
                    Includes 5 identity verification attempts via Stripe Identity
                  </p>
                </div>
              )}

              {/* Attempts counter - show after payment */}
              {player?.verification_status === "paid" && (
                <div className="mt-6 rounded-xl bg-blue-50 p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-700">
                      Verification Attempts
                    </span>
                    <span className="font-display text-lg font-bold text-blue-700">
                      {MAX_VERIFICATION_ATTEMPTS - (player?.verification_attempts || 0)} of {MAX_VERIFICATION_ATTEMPTS} remaining
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-blue-600">
                    Take your time. Good lighting, steady hands, glasses off.
                  </p>
                </div>
              )}

              {/* Verification Form */}
              <VerifyForm
                playerId={player?.id}
                verificationStatus={player?.verification_status || "none"}
                attemptsUsed={player?.verification_attempts || 0}
                maxAttempts={MAX_VERIFICATION_ATTEMPTS}
              />

              {/* Security Note */}
              <div className="mt-6 rounded-xl border border-green/10 bg-aqua-soft p-4">
                <div className="flex gap-3">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-text-light"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-text">
                      Secure Identity Verification
                    </p>
                    <p className="mt-1 text-text-light">
                      We use Stripe Identity for secure government ID verification.
                      Mahjic never stores your ID documents.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
