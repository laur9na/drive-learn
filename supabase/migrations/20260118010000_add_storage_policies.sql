-- Add Storage policies for study-materials bucket
-- This allows authenticated users to upload, view, and delete their own files

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload their own study materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study-materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view their own study materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'study-materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own study materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'study-materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own study materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'study-materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
