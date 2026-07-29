"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import GoogleSignIn from "@/components/GoogleSignIn";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";

export default function Signup() {
  const router = useRouter();
  const { state, ready, setAuthToken } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ mailSent: boolean; verifyLink?: string } | null>(null);

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
    const r = await api.register(name.trim(), email.trim(), password);
    setBusy(false);
    if (r.ok) {
      setSent({ mailSent: r.data.mailSent, verifyLink: r.data.verifyLink });
    } else if (r.error === "network" || r.error === "server-not-configured") {
      // No backend reachable (e.g. local demo) — continue in device-only mode.
      sessionStorage.setItem("studentify:draft", JSON.stringify({ name, email }));
      router.push("/onboarding");
    } else {
      setError(r.message);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email 📬" subtitle={`We sent a verification link to ${email.trim()}`}>
        <div className="text-center animate-fade-up">
          <p className="text-sm text-sub leading-relaxed">
            Click the link in the email to activate your account, then log in.
            {sent.mailSent && " (Check your spam folder if you don't see it within a minute.)"}
          </p>
          {!sent.mailSent && sent.verifyLink && (
            <a
              href={sent.verifyLink}
              className="btn-glow mt-5 inline-block rounded-xl px-6 py-3 text-sm font-semibold"
            >
              Verify my email now →
            </a>
          )}
          <p className="mt-6">
            <Link href="/login" className="text-sm text-accent2 font-medium hover:underline">
              Go to log in →
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free while in beta. Your progress syncs to your account."
    >
      {ready && state.profile && (
        <div className="mb-5 rounded-xl border border-mint/30 bg-mint/10 px-4 py-3 text-xs text-mint">
          👋 Already signed in as <b>{state.profile.name}</b> on this device —{" "}
          <Link href="/dashboard" className="underline font-semibold">
            go to your dashboard
          </Link>
          .
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
          <span className="text-xs font-medium text-sub">Full name</span>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Aarav Sharma" autoComplete="name"
            className="mt-1.5 w-full rounded-xl border border-edge bg-ink/60 px-4 py-3 text-sm placeholder:text-faint outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-sub">Email</span>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.com" autoComplete="email"
            pattern="[^@\s]+@[^@\s]+\.[A-Za-z]{2,}"
            title="Enter a real email address (e.g. name@gmail.com) — you'll need to verify it."
            className="mt-1.5 w-full rounded-xl border border-edge bg-ink/60 px-4 py-3 text-sm placeholder:text-faint outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-sub">Password</span>
          <input
            type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters" autoComplete="new-password"
            className="mt-1.5 w-full rounded-xl border border-edge bg-ink/60 px-4 py-3 text-sm placeholder:text-faint outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="btn-glow w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Create account →"}
        </button>
        <p className="text-[11px] text-faint text-center leading-relaxed">
          We'll email you a verification link — your account activates once you click it.
        </p>
      </form>
      <p className="mt-4 text-center text-sm text-sub">
        Already have an account?{" "}
        <Link href="/login" className="text-accent2 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
