import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Volume2, Play, Pause, CheckCircle2, XCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useClass } from '@/hooks/useClasses';
import { useQuestions } from '@/hooks/useQuestions';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function CommuteSession() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: classData } = useClass(classId);
  const { data: questions, isLoading: questionsLoading } = useQuestions(classId);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [duration, setDuration] = useState(15); // Duration in minutes
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // Will be set to duration * 60 on session start
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionResponses, setSessionResponses] = useState<any[]>([]);

  const { isSpeaking, speak, stop } = useTextToSpeech();
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isSTTSupported,
  } = useSpeechRecognition();

  // Use real questions from database, with formatted options
  const questionsList = (questions || []).map(q => ({
    id: q.id,
    question: q.question_text,
    options: q.options,
    correctAnswer: q.correct_answer,
    explanation: q.explanation || '',
  }));

  const currentQuestion = questionsList[currentQuestionIndex];
  const isQuizComplete = questionsList.length > 0 && currentQuestionIndex === questionsList.length - 1 && answered;
  const percentage = questionsList.length > 0 ? Math.round((score / questionsList.length) * 100) : 0;

  // Timer countdown
  useEffect(() => {
    if (!sessionStarted || isQuizComplete) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStarted, isQuizComplete]);

  // Auto-read question when it changes and auto-start listening
  useEffect(() => {
    if (sessionStarted && !answered) {
      const timer = setTimeout(() => {
        const questionText = `Question ${currentQuestionIndex + 1}. ${currentQuestion.question}. Your options are: ${currentQuestion.options.map((opt, idx) => `Option ${String.fromCharCode(65 + idx)}: ${opt}`).join('. ')}`;
        speak(questionText, 1, 1, () => {
          // Auto-start listening after TTS completes
          if (isSTTSupported && !answered) {
            startListening();
          }
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, sessionStarted, answered, speak, isSTTSupported, startListening]);

  const handleStartSession = async () => {
    if (!user || !classId) return;

    // Set timer based on selected duration
    setTimeRemaining(duration * 60);

    // Create session in database
    const { data: session, error } = await supabase
      .from('commute_sessions')
      .insert({
        user_id: user.id,
        class_id: classId,
        duration_minutes: duration,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      return;
    }

    setSessionId(session.id);
    setSessionStarted(true);
    speak('Session started. Listen carefully to each question and answer by voice when ready.');
  };

  const handleSelectAnswer = async (answer: string) => {
    if (answered || !currentQuestion) return;

    setSelectedAnswer(answer);
    setAnswered(true);

    const isCorrect = answer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
      setFeedback('Correct!');
      speak(`Correct! ${currentQuestion.explanation}`);
    } else {
      setFeedback(`Incorrect. The correct answer is ${currentQuestion.correctAnswer}.`);
      speak(`Incorrect. The correct answer is ${currentQuestion.correctAnswer}. ${currentQuestion.explanation}`);
    }

    // Save response to database
    if (sessionId && user) {
      const response = {
        session_id: sessionId,
        question_id: currentQuestion.id,
        user_answer: answer,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
      };

      setSessionResponses([...sessionResponses, response]);

      await supabase.from('session_responses').insert(response);
    }
  };

  const handleSpeechSubmit = () => {
    const fullTranscript = (transcript + interimTranscript).toLowerCase().trim();

    if (!fullTranscript) {
      setFeedback('No speech detected. Please try again.');
      speak('No speech detected. Please try again.');
      return;
    }

    // Simple matching - check if transcript contains A, B, C, or D
    const letterMatch = fullTranscript.match(/\b([a-d])\b/i);
    if (letterMatch) {
      const letterIndex = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
      if (letterIndex >= 0 && letterIndex < currentQuestion.options.length) {
        handleSelectAnswer(currentQuestion.options[letterIndex]);
        return;
      }
    }

    // Fuzzy match against options
    let bestMatch = '';
    let highestScore = 0;

    currentQuestion.options.forEach((option) => {
      const similarity = calculateSimilarity(fullTranscript, option);
      if (similarity > highestScore) {
        highestScore = similarity;
        bestMatch = option;
      }
    });

    if (highestScore >= 0.5) {
      handleSelectAnswer(bestMatch);
    } else {
      setFeedback(`Could not match "${fullTranscript}" to any answer.`);
      speak('Could not understand your answer. Please try again.');
    }
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    let matchingWords = 0;

    words1.forEach(word1 => {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matchingWords++;
      }
    });

    return matchingWords / Math.max(words1.length, words2.length);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questionsList.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setFeedback(null);
      setAnswered(false);
      resetTranscript();
      stop();
    } else {
      // Session complete - save final results
      if (sessionId) {
        await supabase
          .from('commute_sessions')
          .update({
            ended_at: new Date().toISOString(),
            questions_answered: questionsList.length,
            questions_correct: score,
            completed: true,
          })
          .eq('id', sessionId);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  // No questions available
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="py-12 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Questions Available</h2>
            <p className="text-muted-foreground mb-6">
              Upload study materials to generate quiz questions for this class.
            </p>
            <Button onClick={() => navigate(`/classes/${classId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Class
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => navigate(`/classes/${classId}`)}
              className="w-fit mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Class
            </Button>
            <CardTitle className="text-3xl">Ready to Start?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{classData?.name || 'Commute Session'}</h2>
              <p className="text-muted-foreground mb-6">
                Voice-first learning session - keep your eyes on the road
              </p>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Safety First: Only use this app when it's safe to do so. Pull over if needed.
                </p>
              </div>

              {/* Duration Picker */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3">Set Commute Time</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {[5, 10, 15, 20, 30].map((mins) => (
                    <Button
                      key={mins}
                      variant={duration === mins ? "default" : "outline"}
                      className={duration === mins ? "bg-orchid-gradient" : ""}
                      onClick={() => setDuration(mins)}
                    >
                      {mins} min
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left mb-6">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="text-2xl font-bold text-primary">{duration} min</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Questions</p>
                  <p className="text-2xl font-bold text-primary">{questionsList.length}</p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-orchid-gradient hover:opacity-90 text-lg py-6"
                onClick={handleStartSession}
              >
                <Play className="mr-2 h-6 w-6" />
                Start Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isQuizComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
              <p className="text-4xl font-bold text-primary mb-4">{score}/{questionsList.length}</p>
              <p className="text-lg text-muted-foreground mb-8">{percentage}% Correct</p>

              <div className="bg-primary/5 rounded-lg p-6 mb-8">
                <p className="text-sm text-muted-foreground mb-2">Time Used</p>
                <p className="text-2xl font-bold">{formatTime(duration * 60 - timeRemaining)}</p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/classes/${classId}`)}
                >
                  Back to Class
                </Button>
                <Button
                  className="flex-1 bg-orchid-gradient hover:opacity-90"
                  onClick={() => window.location.reload()}
                >
                  New Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm('Are you sure you want to end this session?')) {
                  navigate(`/classes/${classId}`);
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1}/{questionsList.length}</p>
              <Progress value={((currentQuestionIndex + 1) / questionsList.length) * 100} className="h-2 w-48 mt-1" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{formatTime(timeRemaining)}</p>
            <p className="text-xs text-muted-foreground">Time Remaining</p>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="text-2xl">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Answer Options */}
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option, index) => {
                const letter = String.fromCharCode(65 + index);
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;

                let buttonClass = 'justify-start text-left h-auto py-4 px-6 text-base';
                if (answered) {
                  if (isCorrect) {
                    buttonClass += ' bg-green-100 border-green-500 hover:bg-green-100';
                  } else if (isSelected) {
                    buttonClass += ' bg-red-100 border-red-500 hover:bg-red-100';
                  }
                } else if (isSelected) {
                  buttonClass += ' bg-primary text-primary-foreground';
                }

                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={buttonClass}
                    onClick={() => !answered && handleSelectAnswer(option)}
                    disabled={answered}
                  >
                    <span className="font-bold mr-3">{letter}</span>
                    <span className="flex-1">{option}</span>
                    {answered && isCorrect && <CheckCircle2 className="ml-2 h-5 w-5 text-green-600" />}
                    {answered && isSelected && !isCorrect && <XCircle className="ml-2 h-5 w-5 text-red-600" />}
                  </Button>
                );
              })}
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={`p-4 rounded-lg ${selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className="font-medium mb-2">{feedback}</p>
                {currentQuestion.explanation && (
                  <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                )}
              </div>
            )}

            {/* Voice Controls */}
            {isSTTSupported && !answered && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-center">Answer by Voice</p>
                <div className="flex gap-2">
                  <Button
                    onClick={startListening}
                    disabled={isListening}
                    className="flex-1 bg-orchid-gradient hover:opacity-90"
                    size="lg"
                  >
                    <Mic className="mr-2 h-5 w-5" />
                    {isListening ? 'Listening...' : 'Speak Answer'}
                  </Button>
                  {isListening && (
                    <Button onClick={stopListening} variant="destructive" size="lg">
                      Stop
                    </Button>
                  )}
                </div>

                {(transcript || interimTranscript) && (
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-sm mb-2">
                      <strong>You said:</strong> {transcript}
                      <span className="text-muted-foreground italic">{interimTranscript}</span>
                    </p>
                    <Button onClick={handleSpeechSubmit} className="w-full" size="sm">
                      Submit Answer
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Next Button */}
            {answered && (
              <Button
                onClick={handleNextQuestion}
                className="w-full bg-orchid-gradient hover:opacity-90"
                size="lg"
              >
                {currentQuestionIndex < questionsList.length - 1 ? 'Next Question' : 'Finish Session'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Score */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Current Score</p>
          <p className="text-2xl font-bold text-primary">{score}/{currentQuestionIndex + (answered ? 1 : 0)}</p>
        </div>
      </div>
    </div>
  );
}
