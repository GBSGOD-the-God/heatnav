"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell, { Divider, GoogleButton } from "@/components/AuthShell";
import { useApp } from "@/lib/store";

export default function Signup() {
  const router = useRouter();
  const { state, ready } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("studentify:draft", JSON.stringify({ name, email }));
    router.push("/onboarding");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever. Your data lives on this device until you connect a backend."
    >
      {ready && state.profile && (
        <div className="mb-5 rounded-xl border border-mint/30 bg-mint/10 px-4 py-3 text-xs text-mint">
          👋 An account for <b>{state.profile.name}</b> already exists on this device —{" "}
          <Link href="/dashboard" className="underline font-semibold">
            go to your dashboard
          </Link>
          .
        </div>
      )}
      <GoogleButton label="Sign up with Google" />
      <Divider />
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
        <button type="submit" className="btn-glow w-full rounded-xl py-3 text-sm font-semibold">
          Create account →
        </button>
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
