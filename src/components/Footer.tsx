import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-green-deep text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/">
              <Logo variant="white" size="lg" />
            </Link>
            <p className="mt-4 text-cream/80 max-w-md">
              The open rating system for American Mahjong. Open source algorithm. Player-owned ratings.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-semibold text-coral uppercase tracking-[3px]">
              Platform
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/#how-it-works" className="text-cream/80 hover:text-coral transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-cream/80 hover:text-coral transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/become-a-source" className="text-cream/80 hover:text-coral transition-colors">
                  For Clubs
                </Link>
              </li>
              <li>
                <Link href="/#for-players" className="text-cream/80 hover:text-coral transition-colors">
                  For Players
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-coral uppercase tracking-[3px]">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/#algorithm" className="text-cream/80 hover:text-coral transition-colors">
                  The Algorithm
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-cream/80 hover:text-coral transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/mahjic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cream/80 hover:text-coral transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link href="/privacy" className="text-cream/80 hover:text-coral transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/20">
          <p className="text-center text-cream/60 text-sm">
            &copy; {new Date().getFullYear()} Mahjic. Open source algorithm. Player-owned ratings.
          </p>
        </div>
      </div>
    </footer>
  );
}
