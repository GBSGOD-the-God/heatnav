"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell, { Field } from "@/components/AuthShell";

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {sent ? (
        <div className="text-center animate-fade-up">
          <div className="mx-auto size-14 grid place-items-center rounded-2xl bg-mint/15 border border-mint/30 text-2xl">
            📬
          </div>
          <p className="mt-4 text-sm text-sub leading-relaxed">
            If an account exists for that email, a reset link is on its way. Check your
            inbox (and spam folder).
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm text-accent2 font-medium hover:underline">
            ← Back to log in
          </Link>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <Field label="Email" type="email" placeholder="you@school.com" autoComplete="email" />
          <button type="submit" className="btn-glow w-full rounded-xl py-3 text-sm font-semibold">
            Send reset link
          </button>
          <p className="text-center">
            <Link href="/login" className="text-sm text-sub hover:text-white transition-colors">
              ← Back to log in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
