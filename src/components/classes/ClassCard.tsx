import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Brain, MoreVertical, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Class } from '@/hooks/useClasses';

interface ClassCardProps {
  classItem: Class;
  onEdit?: (classItem: Class) => void;
  onDelete?: (id: string) => void;
}

export const ClassCard = ({ classItem, onEdit, onDelete }: ClassCardProps) => {
  return (
    <Card className="group hover:shadow-lg transition-all border-2 hover:border-primary/30">
      <CardHeader className="relative pb-3">
        <div
          className="absolute top-0 left-0 right-0 h-2 rounded-t-lg"
          style={{ backgroundColor: classItem.color }}
        />
        <div className="flex items-start justify-between pt-2">
          <CardTitle className="text-xl font-bold text-foreground line-clamp-1">
            {classItem.name}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(classItem)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(classItem.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {classItem.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {classItem.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-3 bg-primary/5 rounded-lg">
            <FileText className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Materials</span>
            <span className="text-lg font-bold text-foreground">0</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-primary/5 rounded-lg">
            <Brain className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Questions</span>
            <span className="text-lg font-bold text-foreground">0</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-primary/5 rounded-lg">
            <BookOpen className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Sessions</span>
            <span className="text-lg font-bold text-foreground">0</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Created {new Date(classItem.created_at).toLocaleDateString()}
        </p>
      </CardContent>

      <CardFooter>
        <Link to={`/classes/${classItem.id}`} className="w-full">
          <Button className="w-full bg-orchid-gradient hover:opacity-90">
            View Class
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
