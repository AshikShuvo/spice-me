"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  clearAuthReturnPath,
  consumeAuthReturnPath,
} from "@/lib/auth-return-path";
import { useRouter } from "@/i18n/navigation";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { AuthModalActionsContext } from "./auth-modal-actions-context";
import { AuthModalDismissContext } from "./auth-modal-dismiss-context";

type AuthModalProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /**
   * `modal`          — intercepted dialog: leave via `replace(stored path)` (never `router.back()`).
   * `replace-home`   — full-page /auth/*: `replace("/")` on close or success.
   */
  dismissNavigate?: "modal" | "replace-home";
};

export function AuthModal({
  title,
  description,
  children,
  dismissNavigate = "modal",
}: AuthModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  /** Avoid a second `replace` when Radix fires `onOpenChange(false)` after programmatic success navigation. */
  const skipNextDismissNavigation = useRef(false);

  const goToReturnPath = useCallback(() => {
    if (dismissNavigate === "replace-home") {
      clearAuthReturnPath();
      return router.replace("/");
    }
    return router.replace(consumeAuthReturnPath());
  }, [dismissNavigate, router]);

  const completeSuccessfulAuth = useCallback(async () => {
    skipNextDismissNavigation.current = true;
    setOpen(false);
    /*
     * Leave /auth/* before refresh. Refresh while still on an auth URL can re-render the
     * intercepted @modal segment and remount this component with useState(true) — dialog stays open.
     */
    await goToReturnPath();
    await router.refresh();
  }, [goToReturnPath, router]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      if (skipNextDismissNavigation.current) {
        skipNextDismissNavigation.current = false;
        return;
      }
      void goToReturnPath();
    }
  }

  const actions = { completeSuccessfulAuth };

  return (
    <AuthModalDismissContext.Provider value={dismissNavigate}>
      <AuthModalActionsContext.Provider value={actions}>
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
      </AuthModalActionsContext.Provider>
    </AuthModalDismissContext.Provider>
  );
}
