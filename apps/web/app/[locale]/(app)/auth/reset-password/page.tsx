import { Suspense } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthModal
      title="Reset password"
      description="Choose a new password for your account."
      dismissNavigate="replace-home"
    >
      <Suspense fallback={<p className="text-body text-neutral-30">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthModal>
  );
}
