import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface GeneratedQuestion {
  id: string;
  class_id: string;
  study_material_id: string | null;
  user_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  difficulty: string;
  question_order: number;
  created_at: string;
}

// Fetch all questions for a class
export const useQuestions = (classId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['questions', classId],
    queryFn: async () => {
      if (!user || !classId) throw new Error('Invalid parameters');

      const { data, error } = await (supabase as any)
        .from('generated_questions')
        .select('*')
        .eq('class_id', classId)
        .eq('user_id', user.id)
        .order('question_order', { ascending: true });

      if (error) throw error;
      return data as GeneratedQuestion[];
    },
    enabled: !!user && !!classId,
  });
};

export type { GeneratedQuestion };
