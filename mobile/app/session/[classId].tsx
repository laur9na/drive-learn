import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Vibration,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
}

export default function Session() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    fetchQuestions();
    return () => {
      Speech.stop();
    };
  }, [classId]);

  const fetchQuestions = async () => {
    if (!classId) return;

    const { data, error } = await supabase
      .from('generated_questions')
      .select('*')
      .eq('class_id', classId)
      .order('question_order');

    if (data) {
      setQuestions(data);
    }
  };

  const speak = (text: string, onDone?: () => void) => {
    setIsSpeaking(true);
    Speech.speak(text, {
      rate: 0.9,
      onDone: () => {
        setIsSpeaking(false);
        onDone?.();
      },
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const startSession = async () => {
    if (!user || !classId) return;

    sessionStartTimeRef.current = new Date();

    const { data: session } = await supabase
      .from('commute_sessions')
      .insert({
        user_id: user.id,
        class_id: classId,
        duration_minutes: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (session) {
      sessionIdRef.current = session.id;
    }

    setSessionStarted(true);
    speakCurrentQuestion();
  };

  const speakCurrentQuestion = () => {
    const question = questions[currentIndex];
    if (!question) return;

    const text = `Question ${currentIndex + 1}. ${question.question_text}. Your options are: ${question.options.map((opt, i) => `${String.fromCharCode(65 + i)}: ${opt}`).join('. ')}`;

    speak(text);
  };

  const handleAnswer = async (answer: string) => {
    if (answered) return;

    setSelectedAnswer(answer);
    setAnswered(true);
    stopSpeaking();

    const question = questions[currentIndex];
    const isCorrect = answer === question.correct_answer;

    if (isCorrect) {
      setScore(score + 1);
      Vibration.vibrate(100);
      speak(`Correct! ${question.explanation || ''}`);
    } else {
      Vibration.vibrate([100, 100, 100]);
      speak(`Incorrect. The correct answer is ${question.correct_answer}. ${question.explanation || ''}`);
    }

    // Save response
    if (sessionIdRef.current) {
      await supabase.from('session_responses').insert({
        session_id: sessionIdRef.current,
        question_id: question.id,
        user_answer: answer,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
      });
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswered(false);
      setSelectedAnswer(null);
      setTimeout(speakCurrentQuestion, 500);
    } else {
      endSession();
    }
  };

  const endSession = async () => {
    stopSpeaking();

    if (sessionIdRef.current && sessionStartTimeRef.current) {
      const duration = Math.round(
        (Date.now() - sessionStartTimeRef.current.getTime()) / 60000
      );

      await supabase
        .from('commute_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_minutes: duration,
          questions_answered: currentIndex + 1,
          questions_correct: score,
          completed: true,
        })
        .eq('id', sessionIdRef.current);
    }

    Alert.alert(
      'Session Complete!',
      `You scored ${score}/${questions.length} (${Math.round((score / questions.length) * 100)}%)`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  if (!sessionStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.startScreen}>
          <Ionicons name="car" size={80} color="#6366f1" />
          <Text style={styles.startTitle}>Ready to Learn?</Text>
          <Text style={styles.startSubtitle}>
            {questions.length} questions available
          </Text>

          <View style={styles.safetyWarning}>
            <Ionicons name="warning" size={24} color="#f59e0b" />
            <Text style={styles.safetyText}>
              Keep your eyes on the road. Questions will be read aloud.
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <Ionicons name="play" size={28} color="#fff" />
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const question = questions[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={endSession} style={styles.endButton}>
          <Ionicons name="close" size={24} color="#ef4444" />
        </TouchableOpacity>
        <Text style={styles.progress}>
          {currentIndex + 1} / {questions.length}
        </Text>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionNumber}>Question {currentIndex + 1}</Text>
        <Text style={styles.questionText}>{question?.question_text}</Text>

        {isSpeaking && (
          <TouchableOpacity style={styles.speakingIndicator} onPress={stopSpeaking}>
            <Ionicons name="volume-high" size={24} color="#6366f1" />
            <Text style={styles.speakingText}>Speaking... (tap to stop)</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.optionsContainer}>
        {question?.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isSelected = selectedAnswer === option;
          const isCorrect = option === question.correct_answer;
          const showCorrect = answered && isCorrect;
          const showWrong = answered && isSelected && !isCorrect;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                showCorrect && styles.optionCorrect,
                showWrong && styles.optionWrong,
                isSelected && !answered && styles.optionSelected,
              ]}
              onPress={() => handleAnswer(option)}
              disabled={answered}
            >
              <Text style={styles.optionLetter}>{letter}</Text>
              <Text style={styles.optionText}>{option}</Text>
              {showCorrect && <Ionicons name="checkmark-circle" size={24} color="#22c55e" />}
              {showWrong && <Ionicons name="close-circle" size={24} color="#ef4444" />}
            </TouchableOpacity>
          );
        })}
      </View>

      {answered && (
        <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
          <Text style={styles.nextButtonText}>
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish'}
          </Text>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {!answered && (
        <TouchableOpacity style={styles.repeatButton} onPress={speakCurrentQuestion}>
          <Ionicons name="refresh" size={20} color="#6366f1" />
          <Text style={styles.repeatButtonText}>Repeat Question</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  startTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
  },
  startSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  safetyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    gap: 12,
  },
  safetyText: {
    flex: 1,
    color: '#92400e',
    fontSize: 14,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 32,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    padding: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  endButton: {
    padding: 8,
  },
  progress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  score: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  questionContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  questionNumber: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
    lineHeight: 28,
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0ff',
    borderRadius: 8,
    gap: 8,
  },
  speakingText: {
    color: '#6366f1',
    fontSize: 14,
  },
  optionsContainer: {
    padding: 16,
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  optionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f0ff',
  },
  optionCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  optionWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  repeatButtonText: {
    color: '#6366f1',
    fontSize: 16,
  },
});
