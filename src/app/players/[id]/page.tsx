import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RATING_TIERS, type PlayerTier } from '@/types';

// Define the player type for the profile
interface PlayerProfile {
  id: string;
  name: string;
  tier: PlayerTier;
  mahjic_rating: number;
  verified_rating: number;
  games_played: number;
  created_at: string;
  verified_at?: string;
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
  if (rating >= RATING_TIERS.EXPERT.min) return 'text-purple-600 bg-purple-50 border-purple-200';
  if (rating >= RATING_TIERS.ADVANCED.min) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (rating >= RATING_TIERS.INTERMEDIATE.min) return 'text-green-600 bg-green-50 border-green-200';
  if (rating >= RATING_TIERS.BEGINNER.min) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Player Profile | Mahjic`,
    description: `View the Mahjic rating profile for player ${id}.`,
  };
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch player data
  const { data: player, error } = await supabase
    .from('players')
    .select('id, name, tier, mahjic_rating, verified_rating, games_played, created_at, verified_at')
    .eq('id', id)
    .single();

  // Use demo data if not found or error
  const displayPlayer: PlayerProfile = player || {
    id: id,
    name: 'Demo Player',
    tier: 'verified',
    mahjic_rating: 1645,
    verified_rating: 1632,
    games_played: 87,
    created_at: '2025-06-15T00:00:00Z',
    verified_at: '2025-07-01T00:00:00Z',
  };

  const isDemo = !player;
  const isVerified = displayPlayer.tier === 'verified';

  // Format date
  const memberSince = new Date(displayPlayer.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-yellow-50 border-b border-yellow-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-sm text-yellow-800 text-center">
              Showing demo data. This player profile does not exist yet.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/leaderboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-[#2d5a4a] mb-6"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Leaderboard
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#2d5a4a] to-[#3d7a6a] px-6 sm:px-8 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white/30">
                {displayPlayer.name.charAt(0)}
              </div>

              {/* Name and Badge */}
              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{displayPlayer.name}</h1>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4a84b] rounded-full text-sm font-medium text-[#1d3a3a]">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-sm font-medium text-white">
                      Provisional
                    </span>
                  )}
                </div>
                <p className="mt-2 text-white/80">Member since {memberSince}</p>
              </div>
            </div>
          </div>

          {/* Ratings */}
          <div className="px-6 sm:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Mahjic Rating */}
              <div className="bg-[#faf8f3] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-[#2d5a4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-600">Mahjic Rating</h3>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-gray-900">{displayPlayer.mahjic_rating}</span>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getTierColor(displayPlayer.mahjic_rating)}`}>
                    {getTierLabel(displayPlayer.mahjic_rating)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">All games, against any opponent</p>
              </div>

              {/* Verified Rating */}
              <div className="bg-[#faf8f3] rounded-xl p-6 relative">
                {!isVerified && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <div className="text-center px-4">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-sm text-gray-600">Upgrade to Verified to see</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-[#d4a84b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-600">Verified Rating</h3>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-gray-900">{displayPlayer.verified_rating}</span>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getTierColor(displayPlayer.verified_rating)}`}>
                    {getTierLabel(displayPlayer.verified_rating)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Only vs verified opponents</p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{displayPlayer.games_played}</div>
                <div className="text-sm text-gray-500">Games Played</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">-</div>
                <div className="text-sm text-gray-500">Win Rate</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">-</div>
                <div className="text-sm text-gray-500">Best Streak</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">-</div>
                <div className="text-sm text-gray-500">Clubs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Games</h2>
          </div>
          <div className="px-6 sm:px-8 py-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">Game history coming soon</p>
            <p className="text-sm text-gray-400 mt-1">Recent games will appear here once played at a Verified Source</p>
          </div>
        </div>

        {/* Upgrade CTA for Provisional Players */}
        {!isVerified && (
          <div className="mt-8 bg-gradient-to-r from-[#d4a84b] to-[#e4c87b] rounded-2xl p-6 sm:p-8 text-center">
            <h3 className="text-xl font-bold text-[#1d3a3a] mb-2">Upgrade to Verified</h3>
            <p className="text-[#1d3a3a]/80 mb-6 max-w-md mx-auto">
              Get your Verified badge, appear on the leaderboard, and prove you&apos;re a real player.
              $20/year includes Stripe Identity verification.
            </p>
            <button className="inline-flex items-center justify-center rounded-full bg-[#1d3a3a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2d5a4a] transition-all">
              Upgrade Now - $20/year
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
