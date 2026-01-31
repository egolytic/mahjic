"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "auth_callback_error"
      ? "Authentication failed. Please try again."
      : errorParam === "email_confirmation_error"
        ? "Email confirmation failed. Please try again."
        : null
  );
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (authError) {
        throw authError;
      }

      setEmailSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="rounded-2xl border border-green/10 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green/20">
            <svg
              className="h-6 w-6 text-green-deep"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold text-text">
            Check your email
          </h2>
          <p className="mt-2 text-text-light">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <p className="mt-1 text-sm text-text-light/70">
            Click the link in your email to sign in
          </p>
        </div>

        <button
          onClick={() => {
            setEmailSent(false);
            setEmail("");
          }}
          className="mt-6 w-full text-sm text-text-light hover:text-coral"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-green/10 bg-white p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1 block w-full rounded-lg border border-green/20 bg-cream px-3 py-2 text-text placeholder-text-light/50 focus:border-green-deep focus:outline-none focus:ring-1 focus:ring-green-deep"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full rounded-full bg-coral px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-coral-hover disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send Magic Link"}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-green/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-text-light">
              No password needed
            </span>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-text-light">
          We&apos;ll send you an email with a secure link to sign in instantly
        </p>
      </div>
    </div>
  );
}
