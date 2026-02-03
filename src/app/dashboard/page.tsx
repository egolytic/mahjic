import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";
import type { PlayerTier } from "@/types";

export const metadata = {
  title: "Dashboard | Mahjic",
  description: "View your Mahjic rating and game history",
};

/**
 * Get rating tier label based on rating value.
 */
function getRatingTier(rating: number): string {
  if (rating >= 1800) return "Expert";
  if (rating >= 1600) return "Advanced";
  if (rating >= 1400) return "Intermediate";
  if (rating >= 1200) return "Beginner";
  return "Newcomer";
}

/**
 * Get tier badge color classes.
 */
function getTierBadgeClasses(tier: PlayerTier): string {
  if (tier === "verified") {
    return "bg-gold/20 text-gold";
  }
  return "bg-text-light/10 text-text-light";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Use admin client to bypass RLS for auto-creation
  const adminSupabase = createAdminClient();

  // Try to get player data for this user
  const { data: existingPlayer, error: fetchError } = await adminSupabase
    .from("players")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  // Handle fetch error (but not "no rows found" which is expected for new users)
  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching player:", fetchError);
    // Fall through to auto-creation attempt
  }

  // Auto-create player profile if it doesn't exist
  let playerData = existingPlayer;
  if (!existingPlayer) {
    const playerName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Player";

    const { data: newPlayer, error: createError } = await adminSupabase
      .from("players")
      .insert({
        name: playerName,
        email: user.email,
        auth_user_id: user.id,
        tier: "provisional",
        privacy_mode: "normal",
        mahjic_rating: 1500,
        verified_rating: 1500,
        games_played: 0,
        subscription_status: "none",
        verification_status: "none",
        verification_attempts: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to auto-create player profile:", createError);
      // Redirect to error page or show error state
      redirect("/error?message=Failed+to+create+player+profile");
    }

    console.log(
      `Dashboard: Auto-created player profile for ${user.email} (auth_user_id: ${user.id})`
    );
    playerData = newPlayer;
  }

  // At this point playerData is guaranteed to exist
  // TypeScript assertion since we either have existingPlayer or newPlayer
  const player = playerData!;

  // Get recent game history
  interface GameSessionData {
    session_date: string;
    game_type: string;
    verified_sources: { name: string } | null;
  }
  interface RecentGame {
    id: string;
    created_at: string;
    mahjongs: number;
    games_played: number;
    rating_change: number;
    game_sessions: GameSessionData | null;
  }
  const { data: recentGames } = await adminSupabase
    .from("round_results")
    .select(`
      id,
      created_at,
      mahjongs,
      games_played,
      rating_change,
      game_sessions (
        session_date,
        game_type,
        verified_sources (name)
      )
    `)
    .eq("player_id", player.id)
    .order("created_at", { ascending: false })
    .limit(10) as { data: RecentGame[] | null };

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

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Verification CTA Banner for Provisional Players */}
        {player.tier === "provisional" && (
          <div className="mb-6 rounded-2xl border-2 border-gold bg-gradient-to-r from-gold/10 to-coral/10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-text">
                  Get Verified to Appear on Leaderboards
                </h2>
                <p className="mt-1 text-sm text-text-light">
                  Verify your identity with government ID. $20/year. Takes 2 minutes.
                </p>
              </div>
              <Link
                href="/verify"
                className="inline-flex items-center justify-center rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-hover whitespace-nowrap"
              >
                Get Verified Now
              </Link>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="mb-8 rounded-2xl border border-green/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-text">
                  {player.name}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getTierBadgeClasses(player.tier)}`}
                >
                  {player.tier === "verified" ? "Verified" : "Provisional"}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-light">
                {user.email}
              </p>
            </div>

            {player.tier === "provisional" && (
              <Link
                href="/verify"
                className="inline-flex items-center justify-center rounded-full bg-coral px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coral-hover"
              >
                Upgrade to Verified
              </Link>
            )}
          </div>

          {/* Ratings */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-aqua-soft p-4">
              <p className="text-sm text-text-light">
                Mahjic Rating
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-text">
                {player.mahjic_rating}
              </p>
              <p className="mt-1 text-sm text-text-light">
                {getRatingTier(player.mahjic_rating)}
              </p>
            </div>

            <div className="rounded-xl bg-aqua-soft p-4">
              <p className="text-sm text-text-light">
                Verified Rating
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-text">
                {player.verified_rating}
              </p>
              <p className="mt-1 text-sm text-text-light">
                {player.tier === "verified"
                  ? getRatingTier(player.verified_rating)
                  : "Upgrade to unlock"}
              </p>
            </div>

            <div className="rounded-xl bg-aqua-soft p-4">
              <p className="text-sm text-text-light">
                Games Played
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-text">
                {player.games_played}
              </p>
            </div>

            <div className="rounded-xl bg-aqua-soft p-4">
              <p className="text-sm text-text-light">
                Leaderboard Status
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-text">
                {player.tier === "verified" ? "Visible" : "Hidden"}
              </p>
              <p className="mt-1 text-sm text-text-light">
                {player.tier === "verified"
                  ? "You appear on public leaderboards"
                  : "Verify to appear on leaderboards"}
              </p>
            </div>
          </div>
        </div>

        {/* Game History Section */}
        <div className="rounded-2xl border border-green/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-text">
            Recent Games
          </h2>

          {recentGames && recentGames.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green/10">
                    <th className="pb-3 text-left font-medium text-text-light">
                      Date
                    </th>
                    <th className="pb-3 text-left font-medium text-text-light">
                      Source
                    </th>
                    <th className="pb-3 text-left font-medium text-text-light">
                      Type
                    </th>
                    <th className="pb-3 text-right font-medium text-text-light">
                      Mahjongs
                    </th>
                    <th className="pb-3 text-right font-medium text-text-light">
                      Rating Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentGames.map((game) => (
                    <tr
                      key={game.id}
                      className="border-b border-green/5"
                    >
                      <td className="py-3 text-text">
                        {new Date(
                          game.game_sessions?.session_date || game.created_at
                        ).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-text-light">
                        {game.game_sessions?.verified_sources?.name || "Unknown"}
                      </td>
                      <td className="py-3 capitalize text-text-light">
                        {game.game_sessions?.game_type || "-"}
                      </td>
                      <td className="py-3 text-right text-text">
                        {game.mahjongs} / {game.games_played}
                      </td>
                      <td
                        className={`py-3 text-right font-medium ${
                          game.rating_change > 0
                            ? "text-green-deep"
                            : game.rating_change < 0
                              ? "text-coral"
                              : "text-text-light"
                        }`}
                      >
                        {game.rating_change > 0 ? "+" : ""}
                        {game.rating_change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-aqua-soft p-8 text-center">
              <p className="text-text-light">
                No games recorded yet
              </p>
              <p className="mt-2 text-sm text-text-light/70">
                Play a rated game at any Verified Source to see your history
                here
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
