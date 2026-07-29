"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import GoogleSignIn from "@/components/GoogleSignIn";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, ready, setAuthToken } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verified = params.get("verified");

  async function handleGoogle(credential: string) {
    setBusy(true);
    setError(null);
    const r = await api.googleLogin(credential);
    setBusy(false);
    if (r.ok) {
      sessionStorage.setItem("studentify:draft", JSON.stringify({ name: r.data.name, email: r.data.email }));
      setAuthToken(r.data.token);
      router.push("/dashboard");
    } else {
      setError(r.message);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api.login(email.trim(), password);
    setBusy(false);
    if (r.ok) {
      sessionStorage.setItem("studentify:draft", JSON.stringify({ name: r.data.name, email: r.data.email }));
      setAuthToken(r.data.token);
      router.push("/dashboard");
    } else if ((r.error === "network" || r.error === "server-not-configured") && state.profile) {
      // No backend reachable but a local account exists — use it.
      router.push("/dashboard");
    } else {
      setError(r.message);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Pick up right where you left off.">
      {verified === "1" && (
        <div className="mb-5 rounded-xl border border-mint/30 bg-mint/10 px-4 py-3 text-xs text-mint">
          ✅ Email verified! Your account is active — log in below.
        </div>
      )}
      {verified === "0" && (
        <div className="mb-5 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-xs text-amber">
          That verification link was already used or has expired. Try logging in — if that
          fails, sign up again to get a fresh link.
        </div>
      )}
      {ready && state.profile && (
        <div className="mb-5 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-xs text-accent2">
          Signed in on this device as <b>{state.profile.name}</b> ({state.profile.grade}).{" "}
          <Link href="/dashboard" className="underline font-semibold">
            Continue →
          </Link>
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-xs text-rose">
          {error}
        </div>
      )}
      <GoogleSignIn onCredential={handleGoogle} />
      <form className="space-y-4" onSubmit={submit}>
        <label className="block">
          <span className="text-xs font-medium text-sub">Email</span>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.com" autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-edge bg-ink/60 px-4 py-3 text-sm placeholder:text-faint outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-sub">Password</span>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" autoComplete="current-password"
            className="mt-1.5 w-full rounded-xl border border-edge bg-ink/60 px-4 py-3 text-sm placeholder:text-faint outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
          />
        </label>
        <div className="flex justify-end -mt-1">
          <Link href="/forgot-password" className="text-xs text-accent2 hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="btn-glow w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-60"
        >
          {busy ? "Logging in…" : "Log in"}
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

export default function Login() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
