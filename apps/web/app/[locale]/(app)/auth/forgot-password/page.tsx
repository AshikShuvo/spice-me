import { AuthModal } from "@/components/auth/auth-modal";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthModal
      title="Forgot password"
      description="We will send reset instructions if an account exists."
      dismissNavigate="replace-home"
    >
      <ForgotPasswordForm />
    </AuthModal>
  );
}
