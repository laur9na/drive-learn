import { useState } from 'react';
import { Plus, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClassCard } from '@/components/classes/ClassCard';
import { ClassForm } from '@/components/classes/ClassForm';
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  type Class,
  type CreateClassInput,
} from '@/hooks/useClasses';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Classes() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | undefined>();
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  const { data: classes, isLoading } = useClasses();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const handleCreate = (values: CreateClassInput) => {
    createClass.mutate(values, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  const handleUpdate = (values: CreateClassInput) => {
    if (!editingClass) return;
    updateClass.mutate(
      { id: editingClass.id, ...values },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingClass(undefined);
        },
      }
    );
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingClassId(id);
  };

  const confirmDelete = () => {
    if (!deletingClassId) return;
    deleteClass.mutate(deletingClassId, {
      onSuccess: () => {
        setDeletingClassId(null);
      },
    });
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingClass(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-orchid-gradient mb-2">
              My Classes
            </h1>
            <p className="text-muted-foreground">
              Organize your study materials into classes
            </p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-orchid-gradient hover:opacity-90 shadow-lg"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Class
          </Button>
        </div>

        {/* Classes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 bg-white/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : classes && classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No classes yet
            </h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first class to start organizing your study materials and
              learning on the go
            </p>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-orchid-gradient hover:opacity-90"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create First Class
            </Button>
          </div>
        )}

        {/* Class Form Dialog */}
        <ClassForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          onSubmit={editingClass ? handleUpdate : handleCreate}
          initialValues={editingClass}
          isLoading={createClass.isPending || updateClass.isPending}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingClassId}
          onOpenChange={(open) => !open && setDeletingClassId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Class</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this class? This will also delete
                all associated study materials, questions, and session history. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
