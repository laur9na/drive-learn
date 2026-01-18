import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUploadMaterial } from '@/hooks/useMaterials';

interface FileUploadProps {
  classId: string;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const FileUpload = ({ classId }: FileUploadProps) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const uploadMaterial = useUploadMaterial();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Add files to state with uploading status
      const newFiles: FileWithProgress[] = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: 'uploading' as const,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Upload each file
      for (const fileWithProgress of newFiles) {
        try {
          // Simulate progress (in real app, you'd track actual upload progress)
          const progressInterval = setInterval(() => {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === fileWithProgress.file && f.progress < 90
                  ? { ...f, progress: f.progress + 10 }
                  : f
              )
            );
          }, 200);

          await uploadMaterial.mutateAsync({
            classId,
            file: fileWithProgress.file,
          });

          clearInterval(progressInterval);

          // Mark as success
          setFiles((prev) =>
            prev.map((f) =>
              f.file === fileWithProgress.file
                ? { ...f, progress: 100, status: 'success' as const }
                : f
            )
          );
        } catch (error) {
          // Mark as error
          setFiles((prev) =>
            prev.map((f) =>
              f.file === fileWithProgress.file
                ? {
                    ...f,
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : f
            )
          );
        }
      }
    },
    [classId, uploadMaterial]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (file: File) => {
    setFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'success'));
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              {isDragActive ? (
                <p className="text-lg font-medium text-primary">Drop files here...</p>
              ) : (
                <>
                  <div>
                    <p className="text-lg font-medium text-foreground mb-1">
                      Drag & drop files here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse your computer
                    </p>
                  </div>
                  <Button type="button" variant="outline">
                    Select Files
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    <p>Supported: PDF, DOCX, TXT, MD, PNG, JPG</p>
                    <p>Maximum file size: 50MB</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Uploading Files</h3>
              {files.some((f) => f.status === 'success') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                  className="text-xs"
                >
                  Clear Completed
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {files.map((fileWithProgress, index) => (
                <div
                  key={`${fileWithProgress.file.name}-${index}`}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <File className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {fileWithProgress.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(fileWithProgress.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {fileWithProgress.status === 'uploading' && (
                      <Progress
                        value={fileWithProgress.progress}
                        className="h-1 mt-2"
                      />
                    )}
                    {fileWithProgress.status === 'error' && (
                      <p className="text-xs text-destructive mt-1">
                        {fileWithProgress.error}
                      </p>
                    )}
                  </div>
                  {fileWithProgress.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  {fileWithProgress.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  )}
                  {fileWithProgress.status !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => removeFile(fileWithProgress.file)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
