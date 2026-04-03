import { AuthModal } from "@/components/auth/auth-modal";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthModal
      title="Create account"
      description="Register to order with personal offers."
      dismissNavigate="replace-home"
    >
      <RegisterForm />
    </AuthModal>
  );
}
