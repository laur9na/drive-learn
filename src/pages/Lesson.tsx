import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, BookOpen, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  title: string;
  description: string;
}

interface Module {
  id: string;
  title: string;
  content: string;
  module_order: number;
}

interface Quiz {
  id: string;
  title: string;
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchLessonData();
    }
  }, [id, user]);

  const fetchLessonData = async () => {
    try {
      // Fetch lesson
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      setLesson(lessonData);

      // Fetch modules
      const { data: modulesData } = await supabase
        .from('lesson_modules')
        .select('*')
        .eq('lesson_id', id)
        .order('module_order');

      setModules(modulesData || []);

      // Fetch quiz
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', id)
        .single();

      setQuiz(quizData);

      // Fetch user progress for this lesson
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('module_id')
        .eq('user_id', user?.id)
        .eq('lesson_id', id);

      setCompletedModules(progressData?.map(p => p.module_id).filter(Boolean) as string[] || []);
    } catch (error) {
      console.error('Error fetching lesson data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markModuleComplete = async () => {
    const currentModule = modules[currentModuleIndex];
    if (!currentModule || completedModules.includes(currentModule.id)) {
      goToNextModule();
      return;
    }

    try {
      await supabase.from('user_progress').insert({
        user_id: user?.id,
        lesson_id: id,
        module_id: currentModule.id,
      });

      setCompletedModules(prev => [...prev, currentModule.id]);
      
      toast({
        title: 'Module Complete! 🎉',
        description: 'Great progress! Keep going.',
      });

      goToNextModule();
    } catch (error) {
      console.error('Error marking module complete:', error);
    }
  };

  const goToNextModule = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
    } else if (quiz) {
      navigate(`/quiz/${quiz.id}`);
    } else {
      navigate('/dashboard');
    }
  };

  const goToPrevModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!lesson || modules.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Content Available</h3>
            <p className="text-muted-foreground mb-4">
              This lesson doesn't have any modules yet.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentModule = modules[currentModuleIndex];
  const progressPercentage = ((currentModuleIndex + 1) / modules.length) * 100;
  const isModuleCompleted = completedModules.includes(currentModule.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              <span className="font-semibold">{lesson.title}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentModuleIndex + 1} / {modules.length}
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{currentModule.title}</CardTitle>
                <CardDescription className="mt-2">
                  Module {currentModuleIndex + 1} of {modules.length}
                </CardDescription>
              </div>
              {isModuleCompleted && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none">
              {currentModule.content ? (
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {currentModule.content}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No content available for this module.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPrevModule}
            disabled={currentModuleIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button onClick={markModuleComplete}>
            {currentModuleIndex === modules.length - 1
              ? quiz
                ? 'Take Quiz'
                : 'Complete Lesson'
              : isModuleCompleted
              ? 'Next'
              : 'Mark Complete & Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Module Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Module Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {modules.map((module, index) => (
                <button
                  key={module.id}
                  onClick={() => setCurrentModuleIndex(index)}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    index === currentModuleIndex
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    completedModules.includes(module.id)
                      ? 'bg-green-500 text-white'
                      : index === currentModuleIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {completedModules.includes(module.id) ? '✓' : index + 1}
                  </div>
                  <span className={index === currentModuleIndex ? 'font-medium' : ''}>
                    {module.title}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
