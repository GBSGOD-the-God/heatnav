"use client";

import { useEffect, useState } from "react";

const COLORS = ["#3b6cf6", "#8b5cf6", "#34d399", "#fbbf24", "#fb7185", "#a78bfa"];

export default function Confetti({ count = 60 }: { count?: number }) {
  const [bits, setBits] = useState<
    { left: number; delay: number; duration: number; color: string; w: number }[]
  >([]);

  useEffect(() => {
    setBits(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.2 + Math.random() * 1.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        w: 6 + Math.random() * 7,
      }))
    );
  }, [count]);

  return (
    <div aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={{
            left: `${b.left}%`,
            background: b.color,
            width: b.w,
            height: b.w * 1.5,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
