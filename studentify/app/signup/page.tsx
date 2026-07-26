"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell, { Divider, Field, GoogleButton } from "@/components/AuthShell";

export default function Signup() {
  const router = useRouter();
  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever plan. No credit card required."
    >
      <GoogleButton label="Sign up with Google" />
      <Divider />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/onboarding");
        }}
      >
        <Field label="Full name" type="text" placeholder="Aarav Sharma" autoComplete="name" />
        <Field label="Email" type="email" placeholder="you@school.com" autoComplete="email" />
        <Field label="Password" type="password" placeholder="At least 8 characters" autoComplete="new-password" />
        <button type="submit" className="btn-glow w-full rounded-xl py-3 text-sm font-semibold">
          Create account →
        </button>
        <p className="text-[11px] text-faint text-center leading-relaxed">
          We'll send a verification link to your email. By signing up you agree to our
          Terms &amp; Privacy Policy.
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
