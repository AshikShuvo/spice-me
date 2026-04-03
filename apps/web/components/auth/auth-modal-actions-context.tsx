"use client";

import { createContext, useContext } from "react";

export type AuthModalActions = {
  /** After credentials succeed: refresh, then `replace` to stored path (or fallback), not `router.back()`. */
  completeSuccessfulAuth: () => Promise<void>;
};

export const AuthModalActionsContext = createContext<AuthModalActions | null>(
  null,
);

export function useAuthModalActions(): AuthModalActions | null {
  return useContext(AuthModalActionsContext);
}
