import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Class {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

interface CreateClassInput {
  name: string;
  description?: string;
  color?: string;
}

interface UpdateClassInput {
  name?: string;
  description?: string;
  color?: string;
}

// Fetch all classes for the current user
export const useClasses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['classes', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Class[];
    },
    enabled: !!user,
  });
};

// Fetch a single class by ID
export const useClass = (classId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['class', classId],
    queryFn: async () => {
      if (!user || !classId) throw new Error('Invalid parameters');

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Class;
    },
    enabled: !!user && !!classId,
  });
};

// Create a new class
export const useCreateClass = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateClassInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('classes')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description || null,
          color: input.color || '#DA70D6',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Class;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: 'Class created',
        description: 'Your class has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Update an existing class
export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateClassInput & { id: string }) => {
      const { data, error } = await supabase
        .from('classes')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Class;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class', data.id] });
      toast({
        title: 'Class updated',
        description: 'Your class has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Delete a class
export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('classes').delete().eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: 'Class deleted',
        description: 'Your class has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export type { Class, CreateClassInput, UpdateClassInput };
