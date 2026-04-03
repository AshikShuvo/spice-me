/**
 * NextAuth / Auth.js reads `NEXTAUTH_SECRET` or `AUTH_SECRET`.
 * In development, a fallback avoids MissingSecret when `.env.local` is missing.
 * Production must set a real secret in the environment.
 */
export function getAuthSecret(): string | undefined {
  return (
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "__dev-only-nextauth-secret-not-for-production__"
      : undefined)
  );
}
