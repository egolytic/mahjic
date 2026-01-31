"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ClaimProfileFormProps {
  token: string;
  playerId: string;
  email?: string;
  isLoggedIn: boolean;
}

export function ClaimProfileForm({
  token,
  playerId,
  email,
  isLoggedIn,
}: ClaimProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [inputEmail, setInputEmail] = useState(email || "");

  const handleClaim = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/claim-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, playerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim profile");
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: inputEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/claim/${token}`,
        },
      });

      if (authError) {
        throw authError;
      }

      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="mt-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
          <h3 className="font-medium text-emerald-800 dark:text-emerald-200">
            Check your email
          </h3>
          <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-300">
            We sent a magic link to <strong>{inputEmail}</strong>. Click the
            link to sign in and claim your profile.
          </p>
        </div>
        <button
          onClick={() => setEmailSent(false)}
          className="mt-4 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Use a different email
        </button>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={isLoading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isLoading ? "Claiming..." : "Claim This Profile"}
        </button>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          This will link the player profile to your current account
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendMagicLink} className="mt-6 space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
          placeholder="you@example.com"
        />
        {email && inputEmail !== email && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Note: The profile was created with {email}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !inputEmail}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {isLoading ? "Sending..." : "Send Magic Link"}
      </button>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        We&apos;ll send you an email with a link to sign in and claim your
        profile
      </p>
    </form>
  );
}
