"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

export default function Guard({ children }: { children: React.ReactNode }) {
  const { state, ready } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && !state.profile) router.replace("/signup");
  }, [ready, state.profile, router]);

  if (!ready)
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <span className="size-10 rounded-2xl bg-gradient-to-br from-primary to-accent animate-pulse-glow" />
          <span className="text-xs text-faint">Loading your workspace…</span>
        </div>
      </div>
    );
  if (!state.profile) return null;
  return <>{children}</>;
}
