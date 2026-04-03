const STORAGE_KEY = "spice-me:auth-return-path";

/** When nothing was stored (e.g. direct /auth URL), send users here after auth. */
export const AUTH_RETURN_FALLBACK_PATH = "/menu";

/** Call when navigating from a normal app screen into /auth/*. Skips when already on an auth route (e.g. login → register). */
export function captureAuthReturnPath(pathname: string | null | undefined): void {
  if (typeof window === "undefined") return;
  if (!pathname || pathname.startsWith("/auth")) return;
  sessionStorage.setItem(STORAGE_KEY, pathname);
}

/** Path to open after sign-in / registration or closing the auth modal; clears storage. */
export function consumeAuthReturnPath(): string {
  if (typeof window === "undefined") return AUTH_RETURN_FALLBACK_PATH;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return AUTH_RETURN_FALLBACK_PATH;
  }
  return raw;
}

export function clearAuthReturnPath(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
