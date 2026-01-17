import { AuthForm } from '@/components/auth/AuthForm';

export default function Login() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <AuthForm mode="login" />
    </div>
  );
}
