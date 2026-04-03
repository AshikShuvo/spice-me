"use client";

import { signOut, useSession } from "next-auth/react";
import { useMemo } from "react";
import { createApiClient } from "./api-client";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function useApiClient() {
  const { data: session, update } = useSession();

  return useMemo(
    () =>
      createApiClient({
        baseUrl,
        getAccessToken: async () => session?.accessToken,
        getRefreshToken: async () => session?.refreshToken,
        onTokenRefreshed: async (tokens) => {
          await update({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
        },
        onAuthExpired: async () => {
          await signOut({ callbackUrl: "/" });
        },
      }),
    [session?.accessToken, session?.refreshToken, update],
  );
}
