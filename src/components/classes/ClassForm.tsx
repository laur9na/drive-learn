import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Class } from '@/hooks/useClasses';

const formSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
});

type FormValues = z.infer<typeof formSchema>;

interface ClassFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
  initialValues?: Class;
  isLoading?: boolean;
}

const PRESET_COLORS = [
  '#DA70D6', // Orchid (default)
  '#FFB6D9', // Pink
  '#9B59B6', // Purple
  '#3498DB', // Blue
  '#1ABC9C', // Teal
  '#F39C12', // Orange
  '#E74C3C', // Red
  '#95A5A6', // Gray
];

export const ClassForm = ({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  isLoading,
}: ClassFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      color: initialValues?.color || '#DA70D6',
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
    if (!initialValues) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialValues ? 'Edit Class' : 'Create New Class'}
          </DialogTitle>
          <DialogDescription>
            {initialValues
              ? 'Update your class details'
              : 'Add a new class to organize your study materials'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Venture Capital 101"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What will you learn in this class?"
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Color</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => field.onChange(color)}
                            className={`w-10 h-10 rounded-full transition-all ${
                              field.value === color
                                ? 'ring-4 ring-primary ring-offset-2'
                                : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                            disabled={isLoading}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          {...field}
                          className="w-16 h-10 p-1 cursor-pointer"
                          disabled={isLoading}
                        />
                        <Input
                          type="text"
                          {...field}
                          placeholder="#DA70D6"
                          className="flex-1 font-mono text-sm"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orchid-gradient hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Saving...'
                  : initialValues
                  ? 'Update Class'
                  : 'Create Class'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
