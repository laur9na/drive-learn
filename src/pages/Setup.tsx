import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function Setup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<{
    auth: 'pending' | 'success' | 'error';
    tables: 'pending' | 'success' | 'error';
    storage: 'pending' | 'success' | 'error';
    errors: string[];
  }>({
    auth: 'pending',
    tables: 'pending',
    storage: 'pending',
    errors: [],
  });

  const checkSetup = async () => {
    setChecking(true);
    const errors: string[] = [];
    let authOk = false;
    let tablesOk = false;
    let storageOk = false;

    // Check 1: Auth
    try {
      if (user) {
        authOk = true;
      } else {
        errors.push('Not signed in - go to /login');
      }
    } catch (e: any) {
      errors.push(`Auth error: ${e.message}`);
    }

    setResults((prev) => ({ ...prev, auth: authOk ? 'success' : 'error' }));

    // Check 2: Tables exist
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id')
        .limit(1);

      if (error) {
        errors.push(`Classes table missing or inaccessible: ${error.message}`);
        errors.push('👉 Run the SQL migration in Supabase dashboard');
      } else {
        tablesOk = true;
      }
    } catch (e: any) {
      errors.push(`Tables check failed: ${e.message}`);
    }

    setResults((prev) => ({ ...prev, tables: tablesOk ? 'success' : 'error' }));

    // Check 3: Storage bucket
    try {
      const { data, error } = await supabase.storage.getBucket('study-materials');

      if (error) {
        errors.push('Storage bucket "study-materials" missing');
        errors.push('👉 Create it in Supabase dashboard: Storage > New Bucket > "study-materials" (private)');
      } else {
        storageOk = true;
      }
    } catch (e: any) {
      errors.push(`Storage check failed: ${e.message}`);
    }

    setResults((prev) => ({
      ...prev,
      storage: storageOk ? 'success' : 'error',
      errors,
    }));

    setChecking(false);
  };

  const StatusIcon = ({ status }: { status: 'pending' | 'success' | 'error' }) => {
    if (status === 'pending') return <div className="w-5 h-5 border-2 border-muted rounded-full" />;
    if (status === 'success') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    return <XCircle className="w-5 h-5 text-destructive" />;
  };

  const allGood = results.auth === 'success' && results.tables === 'success' && results.storage === 'success';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">DriveLearn Setup</h1>
        <p className="text-muted-foreground mb-8">
          Let's make sure everything is configured correctly
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>System Checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <StatusIcon status={results.auth} />
              <div className="flex-1">
                <p className="font-medium">Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {user ? `Signed in as ${user.email}` : 'Not signed in'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusIcon status={results.tables} />
              <div className="flex-1">
                <p className="font-medium">Database Tables</p>
                <p className="text-sm text-muted-foreground">
                  Classes, materials, questions, sessions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusIcon status={results.storage} />
              <div className="flex-1">
                <p className="font-medium">File Storage</p>
                <p className="text-sm text-muted-foreground">
                  Supabase storage bucket
                </p>
              </div>
            </div>

            <Button
              onClick={checkSetup}
              disabled={checking}
              className="w-full bg-orchid-gradient"
            >
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {checking ? 'Checking...' : 'Run Setup Check'}
            </Button>
          </CardContent>
        </Card>

        {results.errors.length > 0 && (
          <Card className="border-destructive bg-destructive/5 mb-6">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Setup Issues Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.errors.map((error, i) => (
                  <li key={i} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {allGood && (
          <Card className="border-green-600 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-bold text-green-900">All systems ready!</p>
                  <p className="text-sm text-green-700">You can start using DriveLearn</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/classes')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to Classes
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 p-6 bg-muted/30 rounded-lg text-sm">
          <p className="font-bold mb-2">Setup Instructions:</p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Sign in to your account (or create one at /signup)</li>
            <li>Apply database migration in Supabase SQL Editor:
              <br />
              <code className="text-xs bg-muted p-1 rounded mt-1 block">
                supabase/migrations/20260118000000_create_drivelearn_tables.sql
              </code>
            </li>
            <li>Create storage bucket "study-materials" (private, 50MB max)</li>
            <li>Run setup check above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
