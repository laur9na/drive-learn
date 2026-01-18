// Auth debugging utility
import { supabase } from '@/integrations/supabase/client';

export async function checkAuthStatus() {
  console.log('=== Auth Status Check ===');

  // Check session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Session:', {
    hasSession: !!session,
    userId: session?.user?.id,
    error: sessionError
  });

  // Check user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('User:', {
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
    error: userError
  });

  // Check localStorage
  const storedSession = localStorage.getItem('supabase.auth.token');
  console.log('LocalStorage session:', storedSession ? 'exists' : 'missing');

  // Check if classes table exists by attempting a query
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('id')
      .limit(1);
    console.log('Classes table:', {
      accessible: !error,
      error: error?.message
    });
  } catch (e) {
    console.error('Database check failed:', e);
  }

  console.log('=== End Auth Check ===');

  return { session, user };
}

// Auto-run on import in development
if (import.meta.env.DEV) {
  checkAuthStatus();
}
