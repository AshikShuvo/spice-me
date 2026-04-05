import type { NextAuthConfig } from "next-auth";
import { getAuthSecret } from "./lib/auth-env";

type AuthConfigBase = Omit<NextAuthConfig, "providers">;

export const authConfig: AuthConfigBase = {
  secret: getAuthSecret(),
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      if (trigger === "update" && session) {
        const s = session as {
          accessToken?: string;
          refreshToken?: string;
        };
        if (s.accessToken) token.accessToken = s.accessToken;
        if (s.refreshToken) token.refreshToken = s.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as
          | "ADMIN"
          | "USER"
          | "RESTAURANT_ADMIN";
      }
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    },
  },
};
