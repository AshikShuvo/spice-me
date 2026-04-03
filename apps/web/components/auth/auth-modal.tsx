"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { type ReactNode, useState } from "react";
import { AuthModalDismissContext } from "./auth-modal-dismiss-context";

type AuthModalProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /**
   * `back`         — intercepted modal: closing returns to the previous in-app screen.
   * `replace-home` — full-page /auth/* visit: closing navigates home (no reliable stack).
   */
  dismissNavigate?: "back" | "replace-home";
};

export function AuthModal({
  title,
  description,
  children,
  dismissNavigate = "back",
}: AuthModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      if (dismissNavigate === "replace-home") {
        router.replace("/");
      } else {
        router.back();
      }
    }
  }

  return (
    <AuthModalDismissContext.Provider value={dismissNavigate}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md border-coal-20">
          <DialogHeader>
            <DialogTitle className="font-ringside-compressed text-coal">{title}</DialogTitle>
            {description ? (
              <DialogDescription className="text-body text-neutral-30">
                {description}
              </DialogDescription>
            ) : (
              <DialogDescription className="sr-only">{title} form</DialogDescription>
            )}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </AuthModalDismissContext.Provider>
  );
}
