import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Car, BookOpen, Trophy, LogOut, Play, ChevronRight, GraduationCap } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  order_index: number;
}

interface Profile {
  full_name: string | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();

      setProfile(profileData);

      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index');

      setLessons(lessonsData || []);

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user?.id);

      const completedIds = [...new Set(progressData?.map(p => p.lesson_id) || [])];
      setCompletedLessons(completedIds);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const progressPercentage = lessons.length > 0 
    ? Math.round((completedLessons.length / lessons.length) * 100) 
    : 0;

  const firstName = profile?.full_name?.split(' ')[0] || 'Learner';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-primary-foreground" />
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
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Continue your journey to becoming a confident driver.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{lessons.length}</p>
                  <p className="text-sm text-muted-foreground">Total Lessons</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedLessons.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Overall Progress</p>
                  <p className="text-sm font-bold text-primary">{progressPercentage}%</p>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Classes Section */}
        <div className="mb-8">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orchid-gradient rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">My Classes</h3>
                    <p className="text-sm text-muted-foreground">
                      Organize study materials and learn during your commute
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/classes')}
                  className="bg-orchid-gradient hover:opacity-90"
                  size="lg"
                >
                  View Classes
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lessons Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Your Lessons</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Lessons Yet</h3>
                <p className="text-muted-foreground">
                  Lessons will appear here once they're added to the platform.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson) => {
                const isCompleted = completedLessons.includes(lesson.id);
                return (
                  <Card 
                    key={lesson.id} 
                    className="group cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                  >
                    <CardHeader className="pb-4">
                      <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center mb-4">
                        <Car className="w-12 h-12 text-primary" />
                      </div>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{lesson.title}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {lesson.description}
                          </CardDescription>
                        </div>
                        {isCompleted && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button 
                        variant={isCompleted ? "outline" : "default"} 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        {isCompleted ? 'Review' : 'Start'}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
