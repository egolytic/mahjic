import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClaimProfileForm } from "./claim-form";

export const metadata = {
  title: "Claim Your Profile | Mahjic",
  description: "Claim your Mahjic player profile",
};

interface ClaimPageProps {
  params: Promise<{ token: string }>;
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up the claim token to get player info
  // Note: This assumes a 'claim_tokens' table exists
  const { data: claimData, error: claimError } = await supabase
    .from("claim_tokens")
    .select(`
      id,
      player_id,
      email,
      expires_at,
      claimed_at,
      players (
        id,
        name,
        mahjic_rating,
        games_played
      )
    `)
    .eq("token", token)
    .single() as {
      data: {
        id: string;
        player_id: string;
        email: string;
        expires_at: string;
        claimed_at: string | null;
        players: { id: string; name: string; mahjic_rating: number; games_played: number } | null;
      } | null;
      error: Error | null;
    };

  // Check if token is valid
  if (claimError || !claimData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <h1 className="text-xl font-semibold text-red-800 dark:text-red-200">
              Invalid Claim Link
            </h1>
            <p className="mt-2 text-red-600 dark:text-red-300">
              This claim link is invalid or has expired.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  // Check if already claimed
  if (claimData.claimed_at) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
            <h1 className="text-xl font-semibold text-amber-800 dark:text-amber-200">
              Already Claimed
            </h1>
            <p className="mt-2 text-amber-600 dark:text-amber-300">
              This profile has already been claimed. If this is your profile,
              please log in.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Check if expired
  if (new Date(claimData.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <h1 className="text-xl font-semibold text-red-800 dark:text-red-200">
              Link Expired
            </h1>
            <p className="mt-2 text-red-600 dark:text-red-300">
              This claim link has expired. Please contact your club or play
              another game to receive a new link.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User is logged in - show confirmation to link profile
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Claim Your Profile
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Link this player profile to your account
            </p>

            <div className="mt-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Player Name
              </p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {claimData.players?.name || "Unknown"}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Rating
                  </p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {claimData.players?.mahjic_rating || 1500}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Games
                  </p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {claimData.players?.games_played || 0}
                  </p>
                </div>
              </div>
            </div>

            <ClaimProfileForm
              token={token}
              playerId={claimData.player_id}
              isLoggedIn={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // User not logged in - show login/signup form
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Claim Your Profile
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Sign in with your email to claim this player profile
          </p>

          <div className="mt-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Player Name
            </p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {claimData.players?.name || "Unknown"}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Rating
                </p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {claimData.players?.mahjic_rating || 1500}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Games</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {claimData.players?.games_played || 0}
                </p>
              </div>
            </div>
          </div>

          <ClaimProfileForm
            token={token}
            playerId={claimData.player_id}
            email={claimData.email}
            isLoggedIn={false}
          />
        </div>
      </div>
    </div>
  );
}
