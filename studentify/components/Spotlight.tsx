"use client";

import { useEffect, useRef } from "react";

/** Mouse-follow radial glow overlay for the hero. */
export default function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    let raf = 0;
    function onMove(e: MouseEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = parent!.getBoundingClientRect();
        el!.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el!.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    }
    parent.addEventListener("mousemove", onMove);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="spotlight" aria-hidden />;
}
