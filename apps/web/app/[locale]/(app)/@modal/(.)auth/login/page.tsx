import { AuthModal } from "@/components/auth/auth-modal";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginModalPage() {
  return (
    <AuthModal title="Sign in" description="Access your spice-me account.">
      <LoginForm />
    </AuthModal>
  );
}
