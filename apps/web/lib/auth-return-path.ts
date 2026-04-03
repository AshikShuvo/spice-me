const STORAGE_KEY = "spice-me:auth-return-path";

/** Call when navigating from a normal app screen into /auth/*. Skips when already on an auth route (e.g. login → register). */
export function captureAuthReturnPath(pathname: string | null | undefined): void {
  if (typeof window === "undefined") return;
  if (!pathname || pathname.startsWith("/auth")) return;
  sessionStorage.setItem(STORAGE_KEY, pathname);
}

/** Path to open after successful sign-in / registration; clears storage. */
export function consumeAuthReturnPath(): string {
  if (typeof window === "undefined") return "/";
  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function clearAuthReturnPath(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
