"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

export default function Guard({ children }: { children: React.ReactNode }) {
  const { state, ready, token, syncing } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!ready || syncing) return;
    if (!state.profile) {
      // Logged in but no profile yet (e.g. fresh Google account) → finish onboarding;
      // otherwise → sign up.
      router.replace(token ? "/onboarding" : "/signup");
    }
  }, [ready, syncing, state.profile, token, router]);

  if (!ready || syncing)
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <span className="size-10 rounded-2xl bg-gradient-to-br from-primary to-accent animate-pulse-glow" />
          <span className="text-xs text-faint">
            {syncing ? "Syncing your account…" : "Loading your workspace…"}
          </span>
        </div>
      </div>
    );
  if (!state.profile) return null;
  return <>{children}</>;
}
