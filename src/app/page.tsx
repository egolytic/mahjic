import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-aqua-soft to-cream py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="section-label">Open Rating System</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text">
              Your Mahjong Rating.{' '}
              <span className="text-green-deep">Everywhere.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-text-light max-w-2xl mx-auto">
              The free, open rating system for American Mahjong. Play at any club,
              track your skill, and take your rating wherever you go.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/become-a-source"
                className="btn btn-primary rounded-full shadow-lg hover:shadow-xl"
              >
                Become a Verified Source
                <svg className="ml-2 h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="#how-it-works"
                className="btn btn-outline rounded-full"
              >
                Learn How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 sm:py-20 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text">
              The Problem with Mahjong Ratings Today
            </h2>
            <p className="mt-6 text-lg text-text-light">
              Some organizations want to lock up Mahjong ratings. Play only THEIR events.
              Use only THEIR platform. Your rating belongs to THEM.
            </p>
            <p className="mt-4 text-lg text-text-light">
              That&apos;s not how it should work.
            </p>
            <p className="mt-6 text-xl font-semibold text-green-deep">
              Your skill is yours. Your rating should be too.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-aqua-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-label">Why Mahjic</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text">
              Introducing Mahjic
            </h2>
            <p className="mt-4 text-lg text-text-light">
              The open rating system that belongs to the players.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-cream rounded-2xl p-8 shadow-sm border border-green/10">
              <div className="w-12 h-12 bg-green/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-semibold text-text mb-3">Play Anywhere</h3>
              <p className="text-text-light">
                Your local club. A friend&apos;s league. A tournament across the country.
                One rating follows you everywhere.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-cream rounded-2xl p-8 shadow-sm border border-green/10">
              <div className="w-12 h-12 bg-green/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-semibold text-text mb-3">Open & Transparent</h3>
              <p className="text-text-light">
                The algorithm is open source. No black boxes.
                Anyone can verify how ratings are calculated.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-cream rounded-2xl p-8 shadow-sm border border-green/10">
              <div className="w-12 h-12 bg-green/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-semibold text-text mb-3">Club-First Design</h3>
              <p className="text-text-light">
                Verified Sources (clubs, leagues, platforms) submit results.
                Players don&apos;t have to do anything - just play.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-label">Getting Started</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gold text-white rounded-full text-xl font-bold mb-6">
                1
              </div>
              <h3 className="font-display text-lg font-semibold text-text mb-3">
                Your Club Joins as a Verified Source
              </h3>
              <p className="text-text-light">
                Any club, league, or platform can apply to become a Verified Source. It&apos;s free.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gold text-white rounded-full text-xl font-bold mb-6">
                2
              </div>
              <h3 className="font-display text-lg font-semibold text-text mb-3">
                They Submit Your Games
              </h3>
              <p className="text-text-light">
                After each session, your club reports results. Web form, spreadsheet upload, or API - whatever works for them.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gold text-white rounded-full text-xl font-bold mb-6">
                3
              </div>
              <h3 className="font-display text-lg font-semibold text-text mb-3">
                Your Rating Updates
              </h3>
              <p className="text-text-light">
                Mahjic calculates your new rating based on who you played and how you did. Win against better players? Bigger gains.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gold text-white rounded-full text-xl font-bold mb-6">
                4
              </div>
              <h3 className="font-display text-lg font-semibold text-text mb-3">
                View Your Profile
              </h3>
              <p className="text-text-light">
                See your rating, history, and where you stand. Share your profile. Track your progress over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Clubs Section */}
      <section className="py-16 sm:py-20 bg-green-deep text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[3px] mb-4 text-coral">For Organizers</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">For Clubs & Leagues</h2>
              <p className="mt-4 text-lg text-cream/80">
                Running a Mahjong group? Become a Verified Source.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Free forever</strong> - No fees to submit games</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Simple submission</strong> - Web form, spreadsheet, or API</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Attract players</strong> - Rated play brings competitive players to your events</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>No lock-in</strong> - Your members&apos; ratings are portable</span>
                </li>
              </ul>
              <div className="mt-10">
                <Link
                  href="/become-a-source"
                  className="inline-flex items-center justify-center rounded-full bg-coral px-8 py-3.5 text-base font-semibold text-white hover:bg-coral-hover transition-all"
                >
                  Apply to Become a Verified Source
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="bg-[#3a6b5c] rounded-2xl p-8">
              <div className="text-center">
                <div className="text-6xl font-display font-bold text-gold">$0</div>
                <div className="mt-2 text-xl text-cream/80">per game submitted</div>
                <div className="mt-6 text-cream/60">Forever free for clubs and leagues</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Players Section */}
      <section id="for-players" className="py-16 sm:py-20 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-label">For Players</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text">For Players</h2>
            <p className="mt-4 text-lg text-text-light">
              Just play. Your club handles the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text">Automatic</h3>
                <p className="text-text-light">Your club submits results for you</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text">Portable</h3>
                <p className="text-text-light">Your rating works across any Verified Source</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text">Two Ratings</h3>
                <p className="text-text-light">Overall (all games) + Verified (for leaderboards)</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text">Optional Verification</h3>
                <p className="text-text-light">$20/year for ID-verified leaderboard status</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Player Tiers Section */}
      <section className="py-16 sm:py-20 bg-aqua-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-label">Account Types</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text">Player Tiers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Provisional */}
            <div className="bg-cream rounded-2xl p-8 shadow-sm border border-green/10">
              <div className="inline-block px-3 py-1 bg-text-light/10 rounded-full text-sm font-medium text-text-light mb-4">
                Free
              </div>
              <h3 className="font-display text-2xl font-bold text-text mb-4">Provisional</h3>
              <ul className="space-y-3 text-text-light">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Created automatically when you play at a Verified Source
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track your rating and history
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-text-light/40 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Not visible on public leaderboards
                </li>
              </ul>
            </div>

            {/* Verified */}
            <div className="bg-cream rounded-2xl p-8 shadow-sm border-2 border-gold relative">
              <div className="absolute -top-3 left-8 px-3 py-1 bg-gold rounded-full text-sm font-medium text-white">
                Recommended
              </div>
              <div className="inline-block px-3 py-1 bg-gold/10 rounded-full text-sm font-medium text-gold mb-4">
                $20/year
              </div>
              <h3 className="font-display text-2xl font-bold text-text mb-4">Verified</h3>
              <ul className="space-y-3 text-text-light">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Stripe Identity check (government ID)
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Appear on leaderboards
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified badge on profile
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Proves you&apos;re a real person, not a fake account
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Algorithm Section */}
      <section id="algorithm" className="py-16 sm:py-20 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="section-label">Technical Details</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-text">The Math Behind Mahjic</h2>
              <p className="mt-4 text-lg text-text-light">
                We use <strong>ELO with pairwise comparison</strong>, adapted for 4-player Mahjong.
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-aqua-soft rounded-xl p-6">
                <h3 className="font-semibold text-text mb-2">Win Rate Matters</h3>
                <p className="text-text-light">
                  You&apos;re compared against each player at your table.
                  More mahjongs = higher win rate = you beat them.
                </p>
              </div>

              <div className="bg-aqua-soft rounded-xl p-6">
                <h3 className="font-semibold text-text mb-2">Opponent Strength Matters</h3>
                <p className="text-text-light">
                  Beat higher-rated players? Bigger gains.
                  Lose to lower-rated players? Bigger losses.
                </p>
              </div>

              <div className="bg-aqua-soft rounded-xl p-6">
                <h3 className="font-semibold text-text mb-2">Points Bonus (Leagues)</h3>
                <p className="text-text-light">
                  For league and tournament play, point differentials add a small bonus
                  (plus or minus 5 max) on top of win-rate calculations.
                </p>
              </div>
            </div>

            <p className="mt-8 text-center text-text-light">
              The formula is fully documented and open source. No black boxes.
            </p>
          </div>
        </div>
      </section>

      {/* Two Ratings Section */}
      <section className="py-16 sm:py-20 bg-aqua-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label">Rating System</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text">Two Ratings. One Profile.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-cream rounded-2xl p-8 text-center shadow-sm border border-green/10">
              <div className="w-16 h-16 bg-green-deep rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-text mb-2">Mahjic Rating</h3>
              <p className="text-text-light">All your games, against anyone. Your complete record.</p>
            </div>

            <div className="bg-cream rounded-2xl p-8 text-center shadow-sm border-2 border-gold">
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-text mb-2">Verified Rating</h3>
              <p className="text-text-light">Only games against other Verified players. Used for official leaderboards.</p>
            </div>
          </div>

          <p className="mt-8 text-center text-text-light max-w-2xl mx-auto">
            Why two? To prevent gaming. Someone can&apos;t inflate their rating by playing fake accounts.
            The leaderboard only counts games against ID-verified players.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label">FAQ</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text">Questions?</h2>
          </div>

          <div className="max-w-3xl mx-auto divide-y divide-green/10">
            <div className="py-6">
              <h3 className="text-lg font-semibold text-text">Is Mahjic free?</h3>
              <p className="mt-2 text-text-light">
                Yes for clubs and players. Verified player status costs $20/year (to cover ID verification costs).
              </p>
            </div>

            <div className="py-6">
              <h3 className="text-lg font-semibold text-text">How is this different from other Mahjong ratings?</h3>
              <p className="mt-2 text-text-light">
                Most ratings lock you into one platform. Mahjic is open - any club can participate, and your rating follows you everywhere.
              </p>
            </div>

            <div className="py-6">
              <h3 className="text-lg font-semibold text-text">Can I trust the ratings?</h3>
              <p className="mt-2 text-text-light">
                Yes. Only Verified Sources can submit games. Leaderboards only show ID-verified players. The algorithm is open source.
              </p>
            </div>

            <div className="py-6">
              <h3 className="text-lg font-semibold text-text">What if I play at multiple clubs?</h3>
              <p className="mt-2 text-text-light">
                Great! All your games feed into one rating. Play everywhere, one number.
              </p>
            </div>

            <div className="py-6">
              <h3 className="text-lg font-semibold text-text">What if someone at my table doesn&apos;t want to be tracked?</h3>
              <p className="mt-2 text-text-light">
                Clubs can submit them as anonymous or private. They still affect the table&apos;s ratings but won&apos;t have a public profile.
              </p>
            </div>

            <div className="py-6">
              <h3 className="text-lg font-semibold text-text">I run a club. How do I get started?</h3>
              <p className="mt-2 text-text-light">
                Apply to become a Verified Source. We&apos;ll review your application and get you set up with credentials.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 bg-green-deep text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Ready to Know Your Number?</h2>
          <p className="mt-4 text-lg text-cream/80 max-w-2xl mx-auto">
            For clubs: Become a Verified Source and start submitting games.
            For players: Tell your club about Mahjic. Once they join, you&apos;re in.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/become-a-source"
              className="inline-flex items-center justify-center rounded-full bg-coral px-8 py-3.5 text-base font-semibold text-white hover:bg-coral-hover transition-all"
            >
              Become a Verified Source
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center justify-center rounded-full border-2 border-cream px-8 py-3.5 text-base font-semibold text-cream hover:bg-cream hover:text-green-deep transition-all"
            >
              View the Leaderboard
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
