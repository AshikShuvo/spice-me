"use client";

import { createContext } from "react";

/** Mirrors `AuthModal`’s `dismissNavigate` so forms can close the overlay the same way. */
export type AuthModalDismissMode = "back" | "replace-home";

export const AuthModalDismissContext = createContext<AuthModalDismissMode>("replace-home");
