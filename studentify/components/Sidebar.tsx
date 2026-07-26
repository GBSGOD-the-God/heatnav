"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { student } from "@/lib/data";

const nav = [
  { href: "/dashboard", label: "Dashboard", emoji: "🏠" },
  { href: "/tutor", label: "AI Tutor", emoji: "💬" },
  { href: "/notes", label: "Notes", emoji: "📓" },
  { href: "/flashcards", label: "Flashcards", emoji: "🃏" },
  { href: "/quiz", label: "Quiz", emoji: "🧪" },
  { href: "/planner", label: "Planner", emoji: "🗓️" },
  { href: "/progress", label: "Progress", emoji: "📈" },
  { href: "/settings", label: "Settings", emoji: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-edge/60 bg-panel/80 backdrop-blur-xl z-40">
        <div className="px-5 pt-6 pb-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-primary/25 to-accent/15 text-white border border-primary/30 shadow-[0_4px_20px_-6px_rgba(59,108,246,0.4)]"
                    : "text-sub hover:text-white hover:bg-card border border-transparent"
                }`}
              >
                <span className="text-base">{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4">
          <div className="card rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-sub">
              <span>Level {student.level}</span>
              <span>{student.xp.toLocaleString()} XP</span>
            </div>
            <div className="mt-2.5 h-2 rounded-full bg-edge overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                style={{ width: `${student.levelProgress * 100}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-faint">
              {Math.round((1 - student.levelProgress) * 1000)} XP to Level {student.level + 1}
            </div>
          </div>
        </div>
      </aside>

      {/* mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-edge/60 px-2 py-1.5 flex justify-around">
        {nav.slice(0, 5).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors ${
                active ? "text-white" : "text-faint"
              }`}
            >
              <span className={`text-lg ${active ? "" : "grayscale opacity-70"}`}>{item.emoji}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
