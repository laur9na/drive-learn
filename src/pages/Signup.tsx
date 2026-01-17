import { AuthForm } from '@/components/auth/AuthForm';

export default function Signup() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <AuthForm mode="signup" />
    </div>
  );
}
