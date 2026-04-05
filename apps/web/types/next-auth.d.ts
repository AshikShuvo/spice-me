import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "USER" | "RESTAURANT_ADMIN";
    };
    accessToken: string;
    refreshToken: string;
  }

  interface User {
    role: "ADMIN" | "USER" | "RESTAURANT_ADMIN";
    accessToken: string;
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "USER" | "RESTAURANT_ADMIN";
    accessToken?: string;
    refreshToken?: string;
  }
}
