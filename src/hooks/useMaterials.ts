import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { processDocument } from '@/lib/processDocument';

interface StudyMaterial {
  id: string;
  class_id: string;
  user_id: string;
  title: string;
  file_type: string;
  file_path: string;
  file_size: number | null;
  extracted_text: string | null;
  processing_status: string;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
}

interface UploadMaterialInput {
  classId: string;
  file: File;
}

// Fetch all materials for a class
export const useMaterials = (classId: string | undefined) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['materials', classId],
    queryFn: async () => {
      if (!user || !classId) throw new Error('Invalid parameters');

      const { data, error } = await (supabase as any)
        .from('study_materials')
        .select('*')
        .eq('class_id', classId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StudyMaterial[];
    },
    enabled: !!user && !!classId,
    // Poll every 3 seconds while any materials are processing
    refetchInterval: (query) => {
      const materials = query.state.data as StudyMaterial[] | undefined;
      const hasProcessing = materials?.some(
        (m) => m.processing_status === 'pending' || m.processing_status === 'processing'
      );
      return hasProcessing ? 3000 : false;
    },
  });

  return query;
};

// Upload a new material
export const useUploadMaterial = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ classId, file }: UploadMaterialInput) => {
      if (!user) throw new Error('Not authenticated');

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'image/png',
        'image/jpeg',
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload PDF, DOCX, TXT, MD, or image files.');
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 50MB.');
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${classId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error: dbError } = await (supabase as any)
        .from('study_materials')
        .insert({
          class_id: classId,
          user_id: user.id,
          title: file.name,
          file_type: file.type,
          file_path: filePath,
          file_size: file.size,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (dbError) {
        // Cleanup uploaded file if database insert fails
        await supabase.storage.from('study-materials').remove([filePath]);
        throw dbError;
      }

      // Process document and generate questions (async, non-blocking)
      processDocument(data.id)
        .then(() => {
          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['questions', data.class_id] });
          queryClient.invalidateQueries({ queryKey: ['materials', data.class_id] });
        })
        .catch(() => {
          // Error will be reflected in processing_status
        });

      return data as StudyMaterial;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials', data.class_id] });
      queryClient.invalidateQueries({ queryKey: ['questions', data.class_id] });
      toast({
        title: 'File uploaded',
        description: 'Your study material is being processed. Questions will be generated soon.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Delete a material
export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (material: StudyMaterial) => {
      // First, delete all associated questions
      const { error: questionsError } = await (supabase as any)
        .from('generated_questions')
        .delete()
        .eq('study_material_id', material.id);

      if (questionsError) {
        console.error('Failed to delete questions:', questionsError);
        // Continue anyway - questions might not exist
      }

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('study-materials')
        .remove([material.file_path]);

      if (storageError) throw storageError;

      // Delete database record
      const { error: dbError } = await (supabase as any)
        .from('study_materials')
        .delete()
        .eq('id', material.id);

      if (dbError) throw dbError;

      return material;
    },
    onSuccess: (material) => {
      queryClient.invalidateQueries({ queryKey: ['materials', material.class_id] });
      queryClient.invalidateQueries({ queryKey: ['questions', material.class_id] });
      toast({
        title: 'Material deleted',
        description: 'Your study material and associated questions have been deleted.',
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

export type { StudyMaterial, UploadMaterialInput };
