import { FileText, File, Image, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { StudyMaterial } from '@/hooks/useMaterials';
import { useDeleteMaterial } from '@/hooks/useMaterials';

interface MaterialCardProps {
  material: StudyMaterial;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
  if (fileType.includes('image')) return <Image className="w-8 h-8 text-blue-500" />;
  return <File className="w-8 h-8 text-primary" />;
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />,
        text: 'Processing...',
        color: 'text-yellow-600',
      };
    case 'completed':
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
        text: 'Ready',
        color: 'text-green-600',
      };
    case 'failed':
      return {
        icon: <AlertCircle className="w-4 h-4 text-destructive" />,
        text: 'Failed',
        color: 'text-destructive',
      };
    default:
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />,
        text: 'Processing',
        color: 'text-muted-foreground',
      };
  }
};

export const MaterialCard = ({ material }: MaterialCardProps) => {
  const deleteMaterial = useDeleteMaterial();
  const status = getStatusInfo(material.processing_status);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* File Icon */}
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            {getFileIcon(material.file_type)}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate mb-1">
              {material.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatFileSize(material.file_size)}</span>
              <span>•</span>
              <span>{new Date(material.created_at).toLocaleDateString()}</span>
            </div>
            <div className={`flex items-center gap-1 mt-2 text-xs ${status.color}`}>
              {status.icon}
              <span>{status.text}</span>
            </div>
            {material.processing_error && (
              <p className="text-xs text-destructive mt-1 truncate">
                {material.processing_error}
              </p>
            )}
          </div>

          {/* Actions */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Study Material</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{material.title}"? This will also
                  delete all questions generated from this material. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMaterial.mutate(material)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
