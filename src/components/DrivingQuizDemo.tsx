import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface Question {
  id: number;
  question: string;
  correctAnswer: string;
  options: string[];
  explanation?: string;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'What is pre-money valuation?',
    correctAnswer: 'Company value before investment',
    options: [
      'Company value before investment',
      'Company value after investment',
      'Total funding raised',
      'Expected exit value',
    ],
    explanation: 'Pre-money valuation is the value of a company before receiving external funding or the latest round of financing.',
  },
  {
    id: 2,
    question: 'What is post-money valuation?',
    correctAnswer: 'Company value after investment',
    options: [
      'Company value before investment',
      'Company value after investment',
      'Amount of money raised',
      'Market cap at IPO',
    ],
    explanation: 'Post-money valuation is the company\'s value immediately after receiving investment (pre-money + investment amount).',
  },
  {
    id: 3,
    question: 'What is an option pool?',
    correctAnswer: 'Shares reserved for employees',
    options: [
      'Money for future investments',
      'Shares reserved for employees',
      'Investor voting rights',
      'Secondary market shares',
    ],
    explanation: 'An option pool is a reserve of shares set aside for future employees, typically 10-20% of company equity.',
  },
  {
    id: 4,
    question: 'What is a cap table?',
    correctAnswer: 'Ownership breakdown of a company',
    options: [
      'Maximum valuation limit',
      'Ownership breakdown of a company',
      'List of board members',
      'Investment terms document',
    ],
    explanation: 'A capitalization table (cap table) shows who owns what percentage of the company, including founders, investors, and employees.',
  },
  {
    id: 5,
    question: 'What does dilution mean?',
    correctAnswer: 'Reduction in ownership percentage',
    options: [
      'Increase in company value',
      'Reduction in ownership percentage',
      'Loss of voting rights',
      'Decrease in share price',
    ],
    explanation: 'Dilution occurs when new shares are issued, reducing existing shareholders\' ownership percentage (but not necessarily their dollar value).',
  },
  {
    id: 6,
    question: 'What is a term sheet?',
    correctAnswer: 'Non-binding investment agreement',
    options: [
      'Final legal contract',
      'Non-binding investment agreement',
      'Employee stock agreement',
      'Quarterly financial report',
    ],
    explanation: 'A term sheet outlines the key terms and conditions of an investment deal before formal legal documents are drafted.',
  },
  {
    id: 7,
    question: 'What is liquidation preference?',
    correctAnswer: 'Payout priority in an exit',
    options: [
      'Right to sell shares first',
      'Payout priority in an exit',
      'Board voting power',
      'Stock vesting schedule',
    ],
    explanation: 'Liquidation preference determines who gets paid first and how much when a company is sold or liquidated.',
  },
  {
    id: 8,
    question: 'What is a convertible note?',
    correctAnswer: 'Debt that converts to equity',
    options: [
      'Equity that converts to debt',
      'Debt that converts to equity',
      'Loan with fixed repayment',
      'Stock option grant',
    ],
    explanation: 'A convertible note is a short-term debt that converts into equity during a future financing round, typically at a discount.',
  },
  {
    id: 9,
    question: 'What is a SAFE?',
    correctAnswer: 'Simple Agreement for Future Equity',
    options: [
      'Secured Asset Funding Exchange',
      'Simple Agreement for Future Equity',
      'Stock Allocation for Employees',
      'Standard Accredited Funding Entity',
    ],
    explanation: 'SAFE is a simple agreement for future equity - similar to a convertible note but without debt, interest, or maturity date.',
  },
  {
    id: 10,
    question: 'What is a pro-rata right?',
    correctAnswer: 'Right to maintain ownership percentage',
    options: [
      'Right to vote on board decisions',
      'Right to maintain ownership percentage',
      'Right to sell shares first',
      'Right to audit financials',
    ],
    explanation: 'Pro-rata rights allow investors to participate in future funding rounds to maintain their ownership percentage.',
  },
];

// Utility function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Calculate similarity score between two strings (0-1, higher = more similar)
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Word-based matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);

  let matchingWords = 0;
  words1.forEach(word1 => {
    if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      matchingWords++;
    }
  });

  // Calculate score based on matching words
  const score = matchingWords / Math.max(words1.length, words2.length);
  return score;
};

export const DrivingQuizDemo: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [autoReadQuestion, setAutoReadQuestion] = useState(true);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  const { isListening, transcript, interimTranscript, startListening, stopListening, resetTranscript, isSupported: isSTTSupported, error: sttError } = useSpeechRecognition();
  const { isSpeaking, speak, stop } = useTextToSpeech();

  const currentQuestion = SAMPLE_QUESTIONS[currentQuestionIndex];

  // Shuffle options when question changes
  useEffect(() => {
    setShuffledOptions(shuffleArray(currentQuestion.options));
  }, [currentQuestionIndex]);

  // Auto-read question on load
  useEffect(() => {
    if (autoReadQuestion && !answered) {
      const timer = setTimeout(() => {
        speak(currentQuestion.question);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, answered, autoReadQuestion, speak]);

  const handleSpeakQuestion = () => {
    speak(currentQuestion.question);
  };

  const handleStartListening = () => {
    resetTranscript();
    startListening();
  };

  const handleStopListening = () => {
    stopListening();
  };

  const handleSelectAnswer = (answer: string) => {
    if (answered) return;

    setSelectedAnswer(answer);
    setAnswered(true);

    const isCorrect = answer === currentQuestion.correctAnswer;
    const feedbackText = isCorrect
      ? 'Correct!'
      : `Wrong! The correct answer is: ${currentQuestion.correctAnswer}`;

    setFeedback(feedbackText);
    if (isCorrect) {
      setScore(score + 1);
      speak('Correct!');
    } else {
      speak(`Wrong. The correct answer is ${currentQuestion.correctAnswer}`);
    }
  };

  const handleSpeechSubmit = () => {
    const fullTranscript = (transcript + interimTranscript).toLowerCase().trim();

    if (!fullTranscript) {
      setFeedback('No speech detected. Please try again.');
      speak('No speech detected. Please try again.');
      return;
    }

    // Find the best matching option using similarity scoring
    let bestMatch = '';
    let highestScore = 0;

    shuffledOptions.forEach((option) => {
      const similarity = calculateSimilarity(fullTranscript, option);
      if (similarity > highestScore) {
        highestScore = similarity;
        bestMatch = option;
      }
    });

    // Accept match if similarity is above threshold (50%)
    if (highestScore >= 0.5) {
      handleSelectAnswer(bestMatch);
    } else {
      setFeedback(`Could not match "${fullTranscript}" to any answer. Please try again.`);
      speak('Could not understand your answer. Please try again.');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setFeedback(null);
      setAnswered(false);
      resetTranscript();
    } else {
      handleReset();
    }
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setScore(0);
    setAnswered(false);
    resetTranscript();
    stop();
  };

  const isQuizComplete = currentQuestionIndex === SAMPLE_QUESTIONS.length - 1 && answered;
  const percentage = Math.round((score / SAMPLE_QUESTIONS.length) * 100);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">VC Terms Quiz</h1>
          <p className="text-gray-600">Learn venture capital terminology hands-free with voice</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle>Question {currentQuestionIndex + 1} of {SAMPLE_QUESTIONS.length}</CardTitle>
            <div className="text-sm mt-2 flex justify-between items-center">
              <span>Score: <strong>{score}/{SAMPLE_QUESTIONS.length}</strong></span>
              <span>
                <div className="w-32 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{ width: `${((currentQuestionIndex + 1) / SAMPLE_QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Question */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
              <p className="text-xl font-semibold text-gray-800 mb-4">{currentQuestion.question}</p>
              <Button
                onClick={handleSpeakQuestion}
                disabled={isSpeaking}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isSpeaking ? 'Speaking...' : 'Hear Question'}
              </Button>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-600 mb-2">Select an answer:</p>
              {shuffledOptions.map((option) => {
                let buttonClass = 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-2 border-gray-200';

                if (selectedAnswer === option) {
                  if (option === currentQuestion.correctAnswer) {
                    buttonClass = 'bg-green-500 hover:bg-green-600 text-white border-2 border-green-600';
                  } else {
                    buttonClass = 'bg-red-500 hover:bg-red-600 text-white border-2 border-red-600';
                  }
                } else if (answered && option === currentQuestion.correctAnswer) {
                  buttonClass = 'bg-green-100 border-2 border-green-500 text-green-800';
                }

                return (
                  <Button
                    key={option}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={answered}
                    className={`w-full justify-start text-left h-auto py-3 px-4 ${buttonClass}`}
                    variant="outline"
                  >
                    <span className="flex-1">{option}</span>
                    {selectedAnswer === option && option === currentQuestion.correctAnswer && <span>✓</span>}
                    {selectedAnswer === option && option !== currentQuestion.correctAnswer && <span>✗</span>}
                  </Button>
                );
              })}
            </div>

            {/* Speech Recognition Section */}
            {isSTTSupported && (
              <div className="border-t-2 pt-6">
                <p className="text-sm font-semibold text-gray-600 mb-3">Or answer by voice:</p>
                <div className="space-y-3">
                  <Button
                    onClick={handleStartListening}
                    disabled={isListening || answered}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isListening ? 'Listening... (speak now)' : 'Start Listening'}
                  </Button>

                  {isListening && (
                    <Button onClick={handleStopListening} className="w-full" variant="destructive">
                      Stop Listening
                    </Button>
                  )}

                  {sttError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
                      {sttError}
                    </div>
                  )}

                  {transcript || interimTranscript ? (
                    <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Recognized:</strong> {transcript}
                        <span className="text-gray-400 italic">{interimTranscript}</span>
                      </p>
                      {!answered && (
                        <Button
                          onClick={handleSpeechSubmit}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          size="sm"
                        >
                          Submit Voice Answer
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {!isSTTSupported && !answered && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
                Speech Recognition is not supported in your browser. Use Chrome, Edge, or Safari instead.
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className={`p-4 rounded-lg font-semibold ${
                feedback.includes('Correct')
                  ? 'bg-green-100 border-2 border-green-500 text-green-800'
                  : 'bg-red-100 border-2 border-red-500 text-red-800'
              }`}>
                {feedback}
                {currentQuestion.explanation && (
                  <p className="text-sm mt-2 font-normal">{currentQuestion.explanation}</p>
                )}
              </div>
            )}

            {/* Navigation */}
            {answered && (
              <Button
                onClick={handleNextQuestion}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              >
                {isQuizComplete ? 'Restart Quiz' : 'Next Question'}
              </Button>
            )}

            {/* Results */}
            {isQuizComplete && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg text-center border-2 border-purple-300">
                <p className="text-2xl font-bold mb-2">Quiz Complete!</p>
                <p className="text-4xl font-bold text-purple-600 mb-2">{score}/{SAMPLE_QUESTIONS.length}</p>
                <p className="text-lg text-gray-700 mb-4">{percentage}% Correct</p>
                <p className="text-sm text-gray-600 mb-4">
                  {percentage === 100 && "Perfect score! You're a VC terms expert!"}
                  {percentage >= 80 && percentage < 100 && "Great job! You're mastering VC terminology!"}
                  {percentage >= 60 && percentage < 80 && "Good progress! Review the concepts to improve."}
                  {percentage < 60 && "Keep learning! Try again after reviewing the explanations."}
                </p>
                <Button
                  onClick={handleReset}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  Restart Quiz
                </Button>
              </div>
            )}

            {/* Settings */}
            {!answered && (
              <div className="border-t pt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReadQuestion}
                    onChange={(e) => setAutoReadQuestion(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">Auto-read question</span>
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>DriveLearn - Turn your commute into study time</p>
          <p className="mt-1">Voice-first learning - Built with Web Speech API</p>
        </div>
      </div>
    </div>
  );
};
