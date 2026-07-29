import type { AppState } from "@/lib/store";

/** Client for the PHP backend in /api (same origin). All calls fail soft:
 *  the app keeps working locally if the server is unreachable. */

const TOKEN_KEY = "studentify:token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; message: string };

async function call<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api/${path}`, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? `http-${res.status}`,
        message: data.message ?? "Something went wrong on the server.",
      };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "network", message: "Could not reach the server." };
  }
}

const json = (body: unknown, token?: string | null): RequestInit => ({
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(body),
});

export const api = {
  register(name: string, email: string, password: string) {
    return call<{
      ok: boolean;
      mailSent?: boolean;
      verifyLink?: string;
      message?: string;
      // present when the server has email verification disabled (instant login)
      token?: string;
      name?: string;
      email?: string;
    }>("register.php", json({ name, email, password }));
  },
  login(email: string, password: string) {
    return call<{ token: string; name: string; email: string }>(
      "login.php",
      json({ email, password })
    );
  },
  googleClientId() {
    return call<{ clientId: string | null }>("google.php");
  },
  googleLogin(credential: string) {
    return call<{ token: string; name: string; email: string }>(
      "google.php",
      json({ credential })
    );
  },
  pullState(token: string) {
    return call<{ state: AppState | null; updatedAt: string | null }>("data.php", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  pushState(token: string, state: AppState) {
    return call<{ ok: boolean }>("data.php", json(state, token));
  },
  logout(token: string) {
    return call<{ ok: boolean }>("logout.php", json({}, token));
  },
  deleteAccount(token: string) {
    return call<{ ok: boolean }>("delete.php", json({}, token));
  },
};
