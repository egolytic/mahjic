"use client";

import { useState } from "react";

interface VerifyFormProps {
  playerId?: string;
}

export function VerifyForm({ playerId }: VerifyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verify/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start verification");
      }

      // TODO: Redirect to Stripe Identity verification session
      // For now, we'll just show a placeholder message
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Stripe Identity integration coming soon");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!playerId && (
        <div className="mb-4 rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-gold-hover">
          You need to claim a player profile before you can verify. Play a game
          at a Verified Source first.
        </div>
      )}

      <button
        onClick={handleStartVerification}
        disabled={isLoading || !playerId}
        className="w-full rounded-full bg-coral px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-coral-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Starting..." : "Start Verification - $20"}
      </button>

      <p className="mt-3 text-center text-xs text-text-light">
        You&apos;ll be redirected to Stripe to complete payment and identity
        verification
      </p>
    </div>
  );
}
