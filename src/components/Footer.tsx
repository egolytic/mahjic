import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#1d3a3a] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-bold text-white">
              Mahjic
            </Link>
            <p className="mt-4 text-gray-300 max-w-md">
              The open rating system for American Mahjong. Open source algorithm. Player-owned ratings.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-[#d4a84b] uppercase tracking-wider">
              Platform
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-gray-300 hover:text-white transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/become-a-source" className="text-gray-300 hover:text-white transition-colors">
                  For Clubs
                </Link>
              </li>
              <li>
                <Link href="/#for-players" className="text-gray-300 hover:text-white transition-colors">
                  For Players
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#d4a84b] uppercase tracking-wider">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/#algorithm" className="text-gray-300 hover:text-white transition-colors">
                  The Algorithm
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-gray-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/mahjic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700">
          <p className="text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Mahjic. Open source algorithm. Player-owned ratings.
          </p>
        </div>
      </div>
    </footer>
  );
}
