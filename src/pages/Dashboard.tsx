// Dashboard page for DriveLearn
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, GraduationCap, FileText, Brain, Play, Plus, ArrowRight, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Class {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
}

interface Material {
  id: string;
  class_id: string;
}

interface Question {
  id: string;
  class_id: string;
}

interface Session {
  id: string;
  class_id: string;
  started_at: string;
  questions_answered: number;
  questions_correct: number;
  completed: boolean;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes', user?.id],
    queryFn: async () => {
      if (!user) return [];
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

  // Fetch all materials
  const { data: materials } = useQuery({
    queryKey: ['all-materials', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('study_materials')
        .select('id, class_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as Material[];
    },
    enabled: !!user,
  });

  // Fetch all questions
  const { data: questions } = useQuery({
    queryKey: ['all-questions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('generated_questions')
        .select('id, class_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as Question[];
    },
    enabled: !!user,
  });

  // Fetch recent sessions
  const { data: sessions } = useQuery({
    queryKey: ['recent-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('commute_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as Session[];
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const totalSessions = sessions?.filter(s => s.completed)?.length || 0;
  const totalAnswered = sessions?.reduce((sum, s) => sum + s.questions_answered, 0) || 0;
  const totalCorrect = sessions?.reduce((sum, s) => sum + s.questions_correct, 0) || 0;
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-sm shadow-sm border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orchid-gradient rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">DriveLearn</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Learn while you commute with AI-powered quiz sessions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{classes?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{materials?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Materials</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{questions?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {overallAccuracy > 0 ? `${overallAccuracy}%` : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orchid-gradient rounded-xl flex items-center justify-center shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Create New Class</h3>
                    <p className="text-sm text-muted-foreground">
                      Start organizing your study materials
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/classes')}
                  className="bg-orchid-gradient hover:opacity-90"
                >
                  Create
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Play className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Try Voice Quiz Demo</h3>
                    <p className="text-sm text-muted-foreground">
                      Experience hands-free learning
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/demo')}
                  variant="outline"
                >
                  Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Classes */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">My Classes</h2>
            <Button
              onClick={() => navigate('/classes')}
              variant="outline"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {classesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse border-2">
                  <CardContent className="p-6">
                    <div className="h-20 bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !classes || classes.length === 0 ? (
            <Card className="border-2">
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No Classes Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first class to start organizing study materials and generating quiz questions
                </p>
                <Button
                  onClick={() => navigate('/classes')}
                  className="bg-orchid-gradient hover:opacity-90"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {classes.slice(0, 3).map((classItem) => {
                const classMaterials = materials?.filter(m => m.class_id === classItem.id) || [];
                const classQuestions = questions?.filter(q => q.class_id === classItem.id) || [];

                return (
                  <Card
                    key={classItem.id}
                    className="group cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/30"
                    onClick={() => navigate(`/classes/${classItem.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-xl shadow-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: classItem.color }}
                        >
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{classItem.name}</CardTitle>
                          {classItem.description && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {classItem.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <span>{classMaterials.length} materials</span>
                        <span>•</span>
                        <span>{classQuestions.length} questions</span>
                      </div>
                      <Button
                        className="w-full bg-orchid-gradient hover:opacity-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/classes/${classItem.id}`);
                        }}
                      >
                        View Class
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        {sessions && sessions.length > 0 && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sessions.map((session) => {
                const percentage = session.questions_answered > 0
                  ? Math.round((session.questions_correct / session.questions_answered) * 100)
                  : 0;

                return (
                  <Card key={session.id} className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          percentage >= 80 ? 'bg-green-100' :
                          percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <span className="text-2xl font-bold">
                            {percentage}%
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.started_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.started_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-foreground">
                            {session.questions_answered}
                          </p>
                          <p className="text-xs text-muted-foreground">Questions</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">
                            {session.questions_correct}
                          </p>
                          <p className="text-xs text-muted-foreground">Correct</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
