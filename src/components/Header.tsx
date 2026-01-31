'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#2d5a4a]">Mahjic</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-[#2d5a4a] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm font-medium text-gray-600 hover:text-[#2d5a4a] transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/become-a-source"
              className="text-sm font-medium text-gray-600 hover:text-[#2d5a4a] transition-colors"
            >
              For Clubs
            </Link>
            <Link
              href="/#for-players"
              className="text-sm font-medium text-gray-600 hover:text-[#2d5a4a] transition-colors"
            >
              For Players
            </Link>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link
              href="/become-a-source"
              className="inline-flex items-center justify-center rounded-full bg-[#2d5a4a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3d7a6a] transition-colors"
            >
              Become a Source
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-[#2d5a4a]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-base font-medium text-gray-600 hover:text-[#2d5a4a]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/leaderboard"
                className="text-base font-medium text-gray-600 hover:text-[#2d5a4a]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>
              <Link
                href="/become-a-source"
                className="text-base font-medium text-gray-600 hover:text-[#2d5a4a]"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Clubs
              </Link>
              <Link
                href="/#for-players"
                className="text-base font-medium text-gray-600 hover:text-[#2d5a4a]"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Players
              </Link>
              <Link
                href="/become-a-source"
                className="inline-flex items-center justify-center rounded-full bg-[#2d5a4a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3d7a6a] w-full mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Become a Source
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
