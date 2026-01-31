import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login | Mahjic",
  description: "Sign in to your Mahjic account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome to Mahjic
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Sign in to view your ratings and game history
          </p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="animate-pulse space-y-4">
                <div className="h-10 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-10 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
          Don&apos;t have an account?{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            Play a rated game at any Verified Source and you&apos;ll receive an
            email to claim your profile.
          </span>
        </p>
      </div>
    </div>
  );
}
