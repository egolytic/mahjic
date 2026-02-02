"use client";

import { useState } from "react";
import type { VerificationStatus } from "@/types";

interface VerifyFormProps {
  playerId?: string;
  userEmail?: string;
  verificationStatus: VerificationStatus;
  attemptsUsed: number;
  maxAttempts: number;
}

export function VerifyForm({
  playerId,
  userEmail,
  verificationStatus,
  attemptsUsed,
  maxAttempts,
}: VerifyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attemptsRemaining = maxAttempts - attemptsUsed;
  const canStartIdentity = verificationStatus === "paid" && attemptsRemaining > 0;

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // If no playerId, we'll create a player during checkout
      const response = await fetch("/api/verify/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to create checkout session");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartIdentity = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verify/start-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start verification");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to create verification session");
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

      {/* Not paid yet - show payment button */}
      {verificationStatus === "none" && (
        <>
          {!playerId && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              <strong>New to Mahjic?</strong> No problem! We&apos;ll create your player profile when you verify.
              You&apos;ll start with a 1500 rating.
            </div>
          )}
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full rounded-full bg-coral px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-coral-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Starting..." : "Pay $20 - Become Verified"}
          </button>
          <p className="mt-3 text-center text-xs text-text-light">
            You&apos;ll be redirected to Stripe to complete payment, then return to verify your identity
          </p>
        </>
      )}

      {/* Paid - show identity verification button */}
      {canStartIdentity && (
        <>
          <button
            onClick={handleStartIdentity}
            disabled={isLoading || !playerId}
            className="w-full rounded-full bg-green-deep px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-deep/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Starting..." : "Start Identity Verification"}
          </button>
          <p className="mt-3 text-center text-xs text-text-light">
            You&apos;ll be redirected to Stripe to verify your ID. {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining.
          </p>
        </>
      )}
    </div>
  );
}
