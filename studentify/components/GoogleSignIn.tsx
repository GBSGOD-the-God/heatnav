"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

/** Real Google sign-in via Google Identity Services.
 *  Renders only when the server has a Google client ID configured. */
export default function GoogleSignIn({
  onCredential,
}: {
  onCredential: (credential: string) => void;
}) {
  const [clientId, setClientId] = useState<string | null>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    api.googleClientId().then((r) => {
      if (!cancelled && r.ok && r.data.clientId) setClientId(r.data.clientId);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId || !slotRef.current) return;

    function render() {
      if (!window.google || !slotRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: { credential: string }) => cbRef.current(resp.credential),
      });
      window.google.accounts.id.renderButton(slotRef.current, {
        theme: "filled_black",
        size: "large",
        width: 340,
        text: "continue_with",
        shape: "pill",
      });
    }

    if (window.google) {
      render();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    }
  }, [clientId]);

  if (!clientId) return null;
  return (
    <>
      <div ref={slotRef} className="flex justify-center min-h-11" />
      <div className="my-5 flex items-center gap-4 text-[11px] uppercase tracking-widest text-faint">
        <span className="h-px flex-1 bg-edge" />
        or
        <span className="h-px flex-1 bg-edge" />
      </div>
    </>
  );
}
