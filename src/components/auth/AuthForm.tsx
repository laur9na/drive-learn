import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Car, Loader2 } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({
          title: 'Account created!',
          description: 'Welcome to DriveLearn. Start your learning journey!',
        });
        navigate('/dashboard');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({
          title: 'Welcome back!',
          description: 'Continue your learning journey.',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
          <Car className="w-8 h-8 text-primary-foreground" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription className="mt-2">
            {mode === 'login'
              ? 'Sign in to continue your learning journey'
              : 'Start your driving education today'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/signup')}>
                Sign up
              </Button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
