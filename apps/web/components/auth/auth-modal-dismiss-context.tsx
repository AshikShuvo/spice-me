"use client";

import { createContext } from "react";

/** Mirrors `AuthModal`’s `dismissNavigate`. */
export type AuthModalDismissMode = "modal" | "replace-home";

export const AuthModalDismissContext = createContext<AuthModalDismissMode>("modal");
