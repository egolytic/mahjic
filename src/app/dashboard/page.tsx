import { createClient } from "@/lib/supabase/server";
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
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
  }
  return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
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

  // Try to get player data for this user
  // Note: This assumes a 'players' table exists with 'auth_user_id' column
  // linking to Supabase Auth users
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  // Get recent game history
  // Note: This assumes a 'round_results' or similar table exists
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
  const { data: recentGames } = await supabase
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
    .eq("player_id", player?.id)
    .order("created_at", { ascending: false })
    .limit(10) as { data: RecentGame[] | null };

  // Default values if player doesn't exist yet
  const playerData = player || {
    name: user.email?.split("@")[0] || "Player",
    tier: "provisional" as PlayerTier,
    mahjic_rating: 1500,
    verified_rating: 1500,
    games_played: 0,
  };

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

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Profile Section */}
        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {playerData.name}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getTierBadgeClasses(playerData.tier)}`}
                >
                  {playerData.tier === "verified" ? "Verified" : "Provisional"}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {user.email}
              </p>
            </div>

            {playerData.tier === "provisional" && (
              <Link
                href="/verify"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Upgrade to Verified
              </Link>
            )}
          </div>

          {/* Ratings */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Mahjic Rating
              </p>
              <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {playerData.mahjic_rating}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {getRatingTier(playerData.mahjic_rating)}
              </p>
            </div>

            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Verified Rating
              </p>
              <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {playerData.verified_rating}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {playerData.tier === "verified"
                  ? getRatingTier(playerData.verified_rating)
                  : "Upgrade to unlock"}
              </p>
            </div>

            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Games Played
              </p>
              <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {playerData.games_played}
              </p>
            </div>

            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Leaderboard Status
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {playerData.tier === "verified" ? "Visible" : "Hidden"}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {playerData.tier === "verified"
                  ? "You appear on public leaderboards"
                  : "Verify to appear on leaderboards"}
              </p>
            </div>
          </div>
        </div>

        {/* Game History Section */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recent Games
          </h2>

          {recentGames && recentGames.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="pb-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                      Date
                    </th>
                    <th className="pb-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                      Source
                    </th>
                    <th className="pb-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                      Type
                    </th>
                    <th className="pb-3 text-right font-medium text-zinc-500 dark:text-zinc-400">
                      Mahjongs
                    </th>
                    <th className="pb-3 text-right font-medium text-zinc-500 dark:text-zinc-400">
                      Rating Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentGames.map((game) => (
                    <tr
                      key={game.id}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="py-3 text-zinc-900 dark:text-zinc-50">
                        {new Date(
                          game.game_sessions?.session_date || game.created_at
                        ).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-300">
                        {game.game_sessions?.verified_sources?.name || "Unknown"}
                      </td>
                      <td className="py-3 capitalize text-zinc-600 dark:text-zinc-300">
                        {game.game_sessions?.game_type || "-"}
                      </td>
                      <td className="py-3 text-right text-zinc-900 dark:text-zinc-50">
                        {game.mahjongs} / {game.games_played}
                      </td>
                      <td
                        className={`py-3 text-right font-medium ${
                          game.rating_change > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : game.rating_change < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-zinc-500"
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
            <div className="mt-4 rounded-lg bg-zinc-50 p-8 text-center dark:bg-zinc-800">
              <p className="text-zinc-600 dark:text-zinc-300">
                No games recorded yet
              </p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
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
