import { Suspense } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordModalPage() {
  return (
    <AuthModal title="Reset password" description="Choose a new password for your account.">
      <Suspense fallback={<p className="text-body text-neutral-30">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthModal>
  );
}
