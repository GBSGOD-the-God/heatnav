"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell, { Divider, Field, GoogleButton } from "@/components/AuthShell";

export default function Login() {
  const router = useRouter();
  return (
    <AuthShell title="Welcome back" subtitle="Pick up right where you left off.">
      <GoogleButton label="Continue with Google" />
      <Divider />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/dashboard");
        }}
      >
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
