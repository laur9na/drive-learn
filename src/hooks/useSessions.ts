import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CommuteSession {
  id: string;
  user_id: string;
  class_id: string;
  duration_minutes: number;
  started_at: string;
  ended_at: string | null;
  questions_answered: number;
  questions_correct: number;
  completed: boolean;
  created_at: string;
}

// Fetch all sessions for a class
export const useSessions = (classId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sessions', classId],
    queryFn: async () => {
      if (!user || !classId) throw new Error('Invalid parameters');

      const { data, error } = await (supabase as any)
        .from('commute_sessions')
        .select('*')
        .eq('class_id', classId)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as CommuteSession[];
    },
    enabled: !!user && !!classId,
  });
};

// Calculate overall accuracy for a class
export const useClassAccuracy = (classId: string | undefined) => {
  const { data: sessions } = useSessions(classId);

  if (!sessions || sessions.length === 0) return null;

  const completedSessions = sessions.filter(s => s.completed);
  if (completedSessions.length === 0) return null;

  const totalAnswered = completedSessions.reduce((sum, s) => sum + s.questions_answered, 0);
  const totalCorrect = completedSessions.reduce((sum, s) => sum + s.questions_correct, 0);

  if (totalAnswered === 0) return null;

  return Math.round((totalCorrect / totalAnswered) * 100);
};

export type { CommuteSession };
