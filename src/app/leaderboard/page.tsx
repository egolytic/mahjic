import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { RATING_TIERS } from '@/types';

// Define the player type for the leaderboard
interface LeaderboardPlayer {
  id: string;
  name: string;
  verified_rating: number;
  games_played: number;
  tier: 'provisional' | 'verified';
}

// Get tier label based on rating
function getTierLabel(rating: number): string {
  if (rating >= RATING_TIERS.EXPERT.min) return 'Expert';
  if (rating >= RATING_TIERS.ADVANCED.min) return 'Advanced';
  if (rating >= RATING_TIERS.INTERMEDIATE.min) return 'Intermediate';
  if (rating >= RATING_TIERS.BEGINNER.min) return 'Beginner';
  return 'Newcomer';
}

// Get tier color based on rating
function getTierColor(rating: number): string {
  if (rating >= RATING_TIERS.EXPERT.min) return 'text-purple-600 bg-purple-50';
  if (rating >= RATING_TIERS.ADVANCED.min) return 'text-blue-600 bg-blue-50';
  if (rating >= RATING_TIERS.INTERMEDIATE.min) return 'text-green-deep bg-green/10';
  if (rating >= RATING_TIERS.BEGINNER.min) return 'text-gold bg-gold/10';
  return 'text-text-light bg-text-light/10';
}

export const metadata = {
  title: 'Leaderboard | Mahjic',
  description: 'See the top-rated American Mahjong players on the Mahjic leaderboard.',
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // Fetch top players by verified_rating
  // Only show verified players on the leaderboard
  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, verified_rating, games_played, tier')
    .eq('tier', 'verified')
    .eq('privacy_mode', 'normal')
    .order('verified_rating', { ascending: false })
    .limit(100);

  // If there's an error or no data, show placeholder data for demo
  const displayPlayers: LeaderboardPlayer[] = players?.length ? players : [
    { id: '1', name: 'Alice Chen', verified_rating: 1842, games_played: 156, tier: 'verified' },
    { id: '2', name: 'Bob Williams', verified_rating: 1798, games_played: 203, tier: 'verified' },
    { id: '3', name: 'Carol Martinez', verified_rating: 1756, games_played: 189, tier: 'verified' },
    { id: '4', name: 'David Kim', verified_rating: 1721, games_played: 142, tier: 'verified' },
    { id: '5', name: 'Eva Thompson', verified_rating: 1695, games_played: 167, tier: 'verified' },
    { id: '6', name: 'Frank Garcia', verified_rating: 1678, games_played: 134, tier: 'verified' },
    { id: '7', name: 'Grace Lee', verified_rating: 1654, games_played: 178, tier: 'verified' },
    { id: '8', name: 'Henry Brown', verified_rating: 1632, games_played: 121, tier: 'verified' },
    { id: '9', name: 'Iris Davis', verified_rating: 1618, games_played: 98, tier: 'verified' },
    { id: '10', name: 'Jack Wilson', verified_rating: 1601, games_played: 145, tier: 'verified' },
  ];

  const isDemo = !players?.length;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-aqua-soft border-b border-green/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <p className="section-label">Rankings</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text">Leaderboard</h1>
          <p className="mt-2 text-lg text-text-light">
            Top-rated verified players in American Mahjong
          </p>
        </div>
      </div>

      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-gold/10 border-b border-gold/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-sm text-gold-hover text-center">
              Showing demo data. Real leaderboard data will appear once players are registered.
            </p>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-green/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-green/10">
              <thead className="bg-aqua-soft/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-text-light uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-text-light uppercase tracking-wider">
                    Player
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-text-light uppercase tracking-wider">
                    Rating
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-text-light uppercase tracking-wider">
                    Tier
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-text-light uppercase tracking-wider">
                    Games
                  </th>
                </tr>
              </thead>
              <tbody className="bg-cream divide-y divide-green/10">
                {displayPlayers.map((player, index) => (
                  <tr key={player.id} className="hover:bg-aqua-soft/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            index === 0 ? 'bg-gold text-white' :
                            index === 1 ? 'bg-aqua text-green-deep' :
                            'bg-coral/20 text-coral'
                          }`}>
                            {index + 1}
                          </span>
                        ) : (
                          <span className="text-text-light font-medium pl-2">{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/players/${player.id}`} className="group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-deep rounded-full flex items-center justify-center text-white font-medium">
                            {player.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-text group-hover:text-coral transition-colors">
                              {player.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-text-light">Verified</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-text">{player.verified_rating}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTierColor(player.verified_rating)}`}>
                        {getTierLabel(player.verified_rating)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                      {player.games_played}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-aqua-soft rounded-xl border border-green/10 p-6">
          <h3 className="font-semibold text-text mb-2">About the Leaderboard</h3>
          <p className="text-text-light text-sm">
            This leaderboard shows the <strong>Verified Rating</strong> of ID-verified players.
            The Verified Rating only includes games played against other verified players,
            ensuring the rankings are resistant to manipulation.
            Only players who have completed Stripe Identity verification appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
