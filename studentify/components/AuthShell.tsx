import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/Logo";

export default function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen grid place-items-center px-4 py-10 overflow-hidden">
      <div className="orb w-125 h-125 -top-40 -left-40 bg-primary/20 animate-float-slow" />
      <div className="orb w-100 h-100 -bottom-32 -right-32 bg-accent/20 animate-float" />
      <div className="hero-grid absolute inset-0" aria-hidden />
      <div className={`relative w-full ${wide ? "max-w-xl" : "max-w-md"} animate-fade-up`}>
        <div className="flex justify-center mb-8">
          <Link href="/" aria-label="Back to home">
            <Logo size={40} />
          </Link>
        </div>
        <div className="glass rounded-3xl p-8 shadow-[0_40px_100px_-30px_rgba(59,108,246,0.35)]">
          <h1 className="text-2xl font-bold tracking-tight text-center">{title}</h1>
          <p className="mt-2 text-sm text-sub text-center">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function GoogleButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-center gap-3 rounded-xl border border-edge bg-card2 py-3 text-sm font-semibold hover:border-edge2 hover:bg-card transition-colors"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81Z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.13 0-5.78-2.11-6.72-4.95H1.29v3.09A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.99-3.09Z" />
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43A11.98 11.98 0 0 0 1.29 6.63l3.99 3.09C6.22 6.88 8.87 4.77 12 4.77Z" />
      </svg>
      {label}
    </button>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-4 text-[11px] uppercase tracking-widest text-faint">
      <span className="h-px flex-1 bg-edge" />
      or
      <span className="h-px flex-1 bg-edge" />
    </div>
  );
}

export function Field({
  label,
  type,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-sub">{label}</span>
      <input
        type={type}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-xl border border-edge bg-ink/60 px-4 py-3 text-sm placeholder:text-faint outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
      />
    </label>
  );
}
