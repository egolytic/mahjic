import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login | Mahjic",
  description: "Sign in to your Mahjic account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text">
            Welcome to Mahjic
          </h1>
          <p className="mt-2 text-text-light">
            Sign in to view your ratings and game history
          </p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-green/10 bg-white p-8 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-10 rounded bg-aqua-soft" />
                <div className="h-10 rounded bg-aqua-soft" />
              </div>
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-text-light">
          Don&apos;t have an account?{" "}
          <span className="text-text">
            Play a rated game at any Verified Source and you&apos;ll receive an
            email to claim your profile.
          </span>
        </p>
      </div>
    </div>
  );
}
