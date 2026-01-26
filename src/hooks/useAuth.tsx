import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if token is about to expire (within 5 minutes)
const isTokenExpiringSoon = (session: Session | null): boolean => {
  if (!session?.expires_at) return false;
  const expiresAt = session.expires_at * 1000; // Convert to milliseconds
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() > expiresAt - fiveMinutes;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Refresh session proactively
  const refreshSessionIfNeeded = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) return null;

    if (isTokenExpiringSoon(currentSession)) {
      console.log('Token expiring soon, refreshing...');
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Proactive refresh failed:', error);
        return null;
      }
      return data.session;
    }
    return currentSession;
  }, []);

  useEffect(() => {
    let mounted = true;
    let refreshInterval: NodeJS.Timeout;

    // Get initial session with error handling and refresh
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');

        // First try to get existing session
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session restoration error:', error);
        }

        let finalSession = existingSession;

        // If session exists but is expiring soon, refresh it
        if (existingSession && isTokenExpiringSoon(existingSession)) {
          console.log('Session expiring soon, refreshing...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session) {
            finalSession = refreshData.session;
          }
        }

        // If no session, try refreshing (in case refresh token is still valid)
        if (!finalSession) {
          console.log('No session found, attempting refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session) {
            finalSession = refreshData.session;
            console.log('Session refreshed successfully');
          } else if (refreshError) {
            console.log('Refresh failed, user needs to log in:', refreshError.message);
          }
        }

        if (mounted) {
          setSession(finalSession);
          setUser(finalSession?.user ?? null);
          setLoading(false);
          console.log('Auth initialized:', finalSession ? 'logged in' : 'logged out');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up periodic refresh check (every 4 minutes)
    refreshInterval = setInterval(async () => {
      if (!mounted) return;

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession && isTokenExpiringSoon(currentSession)) {
        console.log('Periodic check: refreshing token...');
        const { data, error } = await supabase.auth.refreshSession();
        if (!error && data.session && mounted) {
          setSession(data.session);
          setUser(data.session.user);
        }
      }
    }, 4 * 60 * 1000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);

      if (!mounted) return;

      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed by Supabase');
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, [refreshSessionIfNeeded]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
