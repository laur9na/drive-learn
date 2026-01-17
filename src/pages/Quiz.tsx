import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Quiz {
  id: string;
  title: string;
  lesson_id: string;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  question_order: number;
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchQuizData();
    }
  }, [id, user]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();

      setQuiz(quizData);

      // Fetch questions
      const { data: questionsData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id)
        .order('question_order');

      // Parse options as string array
      const parsedQuestions = (questionsData || []).map(q => ({
        ...q,
        options: (q.options as string[]) || []
      }));
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error('Error fetching quiz data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Calculate score
    let correctCount = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setShowResults(true);

    // Save attempt
    try {
      await supabase.from('quiz_attempts').insert({
        user_id: user?.id,
        quiz_id: id,
        score: correctCount,
        total_questions: questions.length,
      });

      // Mark lesson as complete
      if (quiz?.lesson_id) {
        await supabase.from('user_progress').upsert({
          user_id: user?.id,
          lesson_id: quiz.lesson_id,
          module_id: null, // null indicates lesson completion
        }, {
          onConflict: 'user_id,lesson_id,module_id'
        });
      }

      const percentage = Math.round((correctCount / questions.length) * 100);
      toast({
        title: percentage >= 70 ? 'Great Job! 🎉' : 'Keep Practicing! 💪',
        description: `You scored ${correctCount}/${questions.length} (${percentage}%)`,
      });
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setScore(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Questions Available</h3>
            <p className="text-muted-foreground mb-4">
              This quiz doesn't have any questions yet.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                passed ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                <Trophy className={`w-10 h-10 ${passed ? 'text-green-600' : 'text-orange-600'}`} />
              </div>
              <CardTitle className="text-2xl">
                {passed ? 'Congratulations! 🎉' : 'Keep Practicing! 💪'}
              </CardTitle>
              <CardDescription>
                {passed 
                  ? 'You passed the quiz!' 
                  : 'You need 70% to pass. Try again!'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-5xl font-bold text-foreground">
                {score}/{questions.length}
              </div>
              <div className="text-lg text-muted-foreground">
                {percentage}% Correct
              </div>
              <Progress value={percentage} className="h-3" />

              {/* Review Answers */}
              <div className="text-left space-y-4 mt-8">
                <h3 className="font-semibold text-lg">Review Your Answers</h3>
                {questions.map((q, index) => {
                  const userAnswer = selectedAnswers[q.id];
                  const isCorrect = userAnswer === q.correct_answer;
                  return (
                    <div key={q.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {index + 1}. {q.question_text}
                          </p>
                          <p className={`text-sm mt-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            Your answer: {userAnswer || 'No answer'}
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-green-600 mt-1">
                              Correct: {q.correct_answer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="flex-1" onClick={handleRetry}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button className="flex-1" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz Taking Screen
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  const allAnswered = questions.every(q => selectedAnswers[q.id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit Quiz
            </Button>
            <span className="font-semibold">{quiz.title}</span>
            <div className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1} / {questions.length}
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </header>

      {/* Question */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardDescription>Question {currentQuestionIndex + 1}</CardDescription>
            <CardTitle className="text-xl">{currentQuestion.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestion.id] === option;
              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                    }`}>
                      {isSelected && <CheckCircle className="w-4 h-4" />}
                    </div>
                    <span className={isSelected ? 'font-medium' : ''}>{option}</span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={!allAnswered}>
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
        </div>

        {/* Question Navigation Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-primary'
                  : selectedAnswers[q.id]
                  ? 'bg-primary/50'
                  : 'bg-border'
              }`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
