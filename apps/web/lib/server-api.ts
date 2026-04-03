import { auth } from "@/auth";
import { createApiClient } from "./api-client";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Authenticated API client for RSC / server actions.
 * Does not run token refresh — if the access token is stale, calls may 401.
 */
export async function createServerApiClient() {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }
  return createApiClient({
    baseUrl,
    getAccessToken: async () => session.accessToken,
    getRefreshToken: async () => session.refreshToken,
    onTokenRefreshed: async () => {
      /* no session update from RSC in this helper */
    },
    onAuthExpired: async () => {
      /* caller handles redirect */
    },
  });
}
