import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Play, FileText, Brain, BarChart3, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useClass, useDeleteClass } from '@/hooks/useClasses';
import { useMaterials } from '@/hooks/useMaterials';
import { useQuestions } from '@/hooks/useQuestions';
import { useClassAccuracy, useSessions } from '@/hooks/useSessions';
import { FileUpload } from '@/components/materials/FileUpload';
import { MaterialCard } from '@/components/materials/MaterialCard';

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { data: classData, isLoading } = useClass(classId);
  const { data: materials, isLoading: materialsLoading } = useMaterials(classId);
  const { data: questions } = useQuestions(classId);
  const { data: sessions } = useSessions(classId);
  const accuracy = useClassAccuracy(classId);
  const deleteClass = useDeleteClass();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading class...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Class not found</h2>
          <p className="text-muted-foreground mb-6">
            The class you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate('/classes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/classes')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center"
                style={{ backgroundColor: classData.color }}
              >
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {classData.name}
                </h1>
                {classData.description && (
                  <p className="text-muted-foreground max-w-2xl">
                    {classData.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="lg">
                    <Trash2 className="mr-2 h-5 w-5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Class</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{classData?.name}"? This will delete all materials, questions, and sessions for this class. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteClass.mutate(classId!);
                        navigate('/classes');
                      }}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                size="lg"
                className="bg-orchid-gradient hover:opacity-90 shadow-lg"
                onClick={() => navigate(`/commute/${classId}`)}
              >
                <Play className="mr-2 h-5 w-5" />
                Start Session
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Study Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {materials?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {materials?.length === 0
                  ? 'No materials uploaded yet'
                  : `File${materials?.length === 1 ? '' : 's'} uploaded`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Generated Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {questions?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {questions?.length === 0
                  ? 'Upload materials to generate questions'
                  : `Question${questions?.length === 1 ? '' : 's'} ready`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {accuracy !== null ? `${accuracy}%` : '-'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {accuracy !== null
                  ? 'Overall performance'
                  : 'Complete sessions to see stats'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="mt-6 space-y-6">
            {/* File Upload */}
            {classId && <FileUpload classId={classId} />}

            {/* Materials List */}
            {materialsLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading materials...</p>
              </div>
            ) : materials && materials.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground mb-3">
                  Uploaded Materials ({materials.length})
                </h3>
                {materials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No materials uploaded yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your first study material to get started
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            {questions && questions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">
                    Generated Questions ({questions.length})
                  </h3>
                </div>
                {questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Question {index + 1}: {question.question_text}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const isCorrect = option === question.correct_answer;
                          return (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border ${
                                isCorrect
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-muted/30 border-muted'
                              }`}
                            >
                              <span className="font-medium mr-2">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <span>{option}</span>
                              {isCorrect && (
                                <span className="ml-2 text-green-600 text-sm font-medium">
                                  ✓ Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {question.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            Explanation:
                          </p>
                          <p className="text-sm text-blue-800">{question.explanation}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
                        <span className="capitalize">
                          Difficulty: {question.difficulty}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No questions yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Questions will appear here after you upload study materials.
                      AI will generate custom quiz questions based on your content.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="mt-6">
            {sessions && sessions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">
                    Session History ({sessions.length})
                  </h3>
                </div>
                {sessions.map((session) => {
                  const percentage = session.questions_answered > 0
                    ? Math.round((session.questions_correct / session.questions_answered) * 100)
                    : 0;
                  const sessionDate = new Date(session.started_at);

                  return (
                    <Card key={session.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                percentage >= 80 ? 'bg-green-100' :
                                percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                              }`}>
                                <span className="text-xl font-bold">
                                  {percentage}%
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {sessionDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {sessionDate.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Questions</p>
                                <p className="text-lg font-semibold">
                                  {session.questions_answered}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Correct</p>
                                <p className="text-lg font-semibold text-green-600">
                                  {session.questions_correct}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Duration</p>
                                <p className="text-lg font-semibold">
                                  {session.duration_minutes} min
                                </p>
                              </div>
                            </div>
                          </div>
                          {session.completed && (
                            <div className="ml-4">
                              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                Completed
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No sessions yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Your commute learning sessions will appear here with stats
                      and progress tracking.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
