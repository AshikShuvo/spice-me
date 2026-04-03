"use client";

import { Link } from "@/i18n/navigation";

export function AuthFormSwitcher({ mode }: { mode: "login" | "register" }) {
  if (mode === "login") {
    return (
      <p className="text-center text-body text-neutral-30">
        No account?{" "}
        <Link
          href="/auth/register"
          scroll={false}
          className="font-medium text-peppes-red hover:text-glowing-red"
        >
          Register
        </Link>
      </p>
    );
  }
  return (
    <p className="text-center text-body text-neutral-30">
      Already have an account?{" "}
      <Link
        href="/auth/login"
        scroll={false}
        className="font-medium text-peppes-red hover:text-glowing-red"
      >
        Sign in
      </Link>
    </p>
  );
}
