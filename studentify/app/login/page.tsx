"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell, { Divider, Field, GoogleButton } from "@/components/AuthShell";
import { useApp } from "@/lib/store";

export default function Login() {
  const router = useRouter();
  const { state, ready } = useApp();
  const [noAccount, setNoAccount] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state.profile) router.push("/dashboard");
    else setNoAccount(true);
  }

  return (
    <AuthShell title="Welcome back" subtitle="Pick up right where you left off.">
      {ready && state.profile && (
        <div className="mb-5 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-xs text-accent2">
          Signed in on this device as <b>{state.profile.name}</b> ({state.profile.grade}).
        </div>
      )}
      {noAccount && (
        <div className="mb-5 rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-xs text-rose">
          No account found on this device.{" "}
          <Link href="/signup" className="underline font-semibold">
            Create one
          </Link>{" "}
          — it takes 30 seconds.
        </div>
      )}
      <GoogleButton label="Continue with Google" />
      <Divider />
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Email" type="email" placeholder="you@school.com" autoComplete="email" />
        <Field label="Password" type="password" placeholder="••••••••" autoComplete="current-password" />
        <div className="flex justify-end -mt-1">
          <Link href="/forgot-password" className="text-xs text-accent2 hover:underline">
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="btn-glow w-full rounded-xl py-3 text-sm font-semibold">
          Log in
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-sub">
        New to Studentify?{" "}
        <Link href="/signup" className="text-accent2 font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
