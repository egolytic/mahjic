'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Logo } from './Logo';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-green/10">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-text hover:text-coral transition-colors"
            >
              Home
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm font-medium text-text hover:text-coral transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/become-a-source"
              className="text-sm font-medium text-text hover:text-coral transition-colors"
            >
              For Clubs
            </Link>
            <Link
              href="/#for-players"
              className="text-sm font-medium text-text hover:text-coral transition-colors"
            >
              For Players
            </Link>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link
              href="/become-a-source"
              className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral-hover transition-colors"
            >
              Become a Source
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-text hover:bg-aqua-soft hover:text-green-deep"
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
          <div className="md:hidden border-t border-green/10 py-4">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-base font-medium text-text hover:text-coral"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/leaderboard"
                className="text-base font-medium text-text hover:text-coral"
                onClick={() => setMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>
              <Link
                href="/become-a-source"
                className="text-base font-medium text-text hover:text-coral"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Clubs
              </Link>
              <Link
                href="/#for-players"
                className="text-base font-medium text-text hover:text-coral"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Players
              </Link>
              <Link
                href="/become-a-source"
                className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral-hover w-full mt-2"
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
