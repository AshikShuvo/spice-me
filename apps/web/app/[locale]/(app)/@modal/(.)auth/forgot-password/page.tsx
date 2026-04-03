import { AuthModal } from "@/components/auth/auth-modal";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordModalPage() {
  return (
    <AuthModal
      title="Forgot password"
      description="We will send reset instructions if an account exists."
    >
      <ForgotPasswordForm />
    </AuthModal>
  );
}
