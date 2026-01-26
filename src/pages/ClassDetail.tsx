import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, FileText, Brain, BarChart3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useClass, useDeleteClass } from '@/hooks/useClasses';
import { useMaterials } from '@/hooks/useMaterials';
import { useQuestions } from '@/hooks/useQuestions';
import { useSessions } from '@/hooks/useSessions';
import { FileUpload } from '@/components/materials/FileUpload';
import { MaterialCard } from '@/components/materials/MaterialCard';

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const { data: classData, isLoading, error } = useClass(classId);
  const { data: materials } = useMaterials(classId);
  const { data: questions } = useQuestions(classId);
  const { data: sessions } = useSessions(classId);
  const deleteClass = useDeleteClass();

  // Safe arrays
  const materialsList = materials ?? [];
  const questionsList = questions ?? [];
  const sessionsList = sessions ?? [];

  // Calculate accuracy
  const completedSessions = sessionsList.filter((s) => s.completed);
  const totalAnswered = completedSessions.reduce((sum, s) => sum + s.questions_answered, 0);
  const totalCorrect = completedSessions.reduce((sum, s) => sum + s.questions_correct, 0);
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading class...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !classData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2 text-red-600">
            {error ? 'Error Loading Class' : 'Class Not Found'}
          </h2>
          <p className="text-gray-500 mb-6">
            {error instanceof Error ? error.message : 'The class does not exist.'}
          </p>
          <Button onClick={() => navigate('/classes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (classId) {
      deleteClass.mutate(classId);
      navigate('/classes');
    }
  };

  // Safe options getter
  const getOptions = (opts: unknown): string[] => {
    if (Array.isArray(opts)) return opts;
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/classes')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl shadow flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: classData.color || '#DA70D6' }}
              >
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{classData.name}</h1>
                {classData.description && (
                  <p className="text-gray-500 mt-1">{classData.description}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Class</AlertDialogTitle>
                    <AlertDialogDescription>
                      Delete "{classData.name}"? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate(`/trip-setup/${classId}`)}
                disabled={questionsList.length === 0}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Learning
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{materialsList.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <Brain className="h-4 w-4" /> Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{questionsList.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{accuracy !== null ? `${accuracy}%` : '-'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="materials">
          <TabsList className="mb-6">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            {classId && <FileUpload classId={classId} />}

            {materialsList.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold">Uploaded ({materialsList.length})</h3>
                {materialsList.map((m) => (
                  <MaterialCard key={m.id} material={m} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No materials yet. Upload files above.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            {questionsList.length > 0 ? (
              questionsList.map((q, i) => (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle className="text-base">Q{i + 1}: {q.question_text}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getOptions(q.options).map((opt, j) => (
                        <div
                          key={j}
                          className={`p-2 rounded border ${
                            opt === q.correct_answer ? 'bg-green-50 border-green-300' : 'bg-gray-50'
                          }`}
                        >
                          {String.fromCharCode(65 + j)}. {opt}
                          {opt === q.correct_answer && (
                            <span className="ml-2 text-green-600 text-sm">Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No questions yet. Upload materials to generate.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            {sessionsList.length > 0 ? (
              sessionsList.map((s) => {
                const pct = s.questions_answered > 0
                  ? Math.round((s.questions_correct / s.questions_answered) * 100)
                  : 0;
                return (
                  <Card key={s.id}>
                    <CardContent className="py-4 flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                          pct >= 80 ? 'bg-green-100' : pct >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}
                      >
                        {pct}%
                      </div>
                      <div>
                        <p className="font-medium">{new Date(s.started_at).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">
                          {s.questions_correct}/{s.questions_answered} correct
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No sessions yet. Start learning to track progress.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
