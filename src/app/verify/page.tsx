import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";
import { VerifyForm } from "./verify-form";

export const metadata = {
  title: "Verify Your Identity | Mahjic",
  description: "Upgrade to a verified Mahjic account",
};

export default async function VerifyPage() {
  const supabase = await createClient();

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
  if (player?.tier === "verified") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
            >
              Mahjic
            </Link>
            <UserMenu user={user} />
          </div>
        </header>

        <main className="mx-auto max-w-xl px-4 py-12">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900 dark:bg-emerald-950">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
              <svg
                className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
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
            <h1 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200">
              Already Verified
            </h1>
            <p className="mt-2 text-emerald-600 dark:text-emerald-300">
              Your account is already verified. You appear on leaderboards and
              have a verified badge.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Go to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
          >
            Mahjic
          </Link>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Upgrade to Verified
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Verify your identity to unlock all Mahjic features
          </p>

          {/* Benefits */}
          <div className="mt-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Verified Benefits
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
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
                <span className="text-zinc-700 dark:text-zinc-300">
                  <strong>Appear on Leaderboards</strong> - Compete for regional
                  and global rankings
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
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
                <span className="text-zinc-700 dark:text-zinc-300">
                  <strong>Verified Badge</strong> - Show others your identity is
                  confirmed
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
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
                <span className="text-zinc-700 dark:text-zinc-300">
                  <strong>Verified Rating</strong> - Get a separate rating based
                  on games vs other verified players
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
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
                <span className="text-zinc-700 dark:text-zinc-300">
                  <strong>Anti-Fraud Protection</strong> - ID verification
                  prevents fake accounts from gaming the system
                </span>
              </li>
            </ul>
          </div>

          {/* Pricing */}
          <div className="mt-8 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Annual Verification
              </span>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                $20
                <span className="text-sm font-normal text-zinc-500">/year</span>
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Includes government ID verification via Stripe Identity
            </p>
          </div>

          {/* Verification Form */}
          <VerifyForm playerId={player?.id} />

          {/* Security Note */}
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-zinc-400"
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
                <p className="font-medium text-zinc-700 dark:text-zinc-300">
                  Secure Identity Verification
                </p>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  We use Stripe Identity for secure government ID verification.
                  Mahjic never stores your ID documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
