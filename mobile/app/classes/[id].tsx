import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

interface ClassDetails {
  id: string;
  name: string;
  description: string | null;
}

interface Question {
  id: string;
  question_text: string;
}

export default function ClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied'>('checking');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchClassDetails();
    checkLocationPermission();
  }, [id]);

  const fetchClassDetails = async () => {
    if (!user || !id) return;

    const [classResult, questionsResult] = await Promise.all([
      supabase.from('classes').select('*').eq('id', id).single(),
      supabase
        .from('generated_questions')
        .select('id, question_text')
        .eq('class_id', id)
        .limit(100),
    ]);

    if (classResult.data) {
      setClassData(classResult.data);
    }
    if (questionsResult.data) {
      setQuestions(questionsResult.data);
    }
    setLoading(false);
  };

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationStatus(status === 'granted' ? 'granted' : 'denied');
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(status === 'granted' ? 'granted' : 'denied');
  };

  const startSession = () => {
    if (questions.length === 0) {
      Alert.alert('No Questions', 'Upload study materials from the web app first');
      return;
    }
    router.push(`/session/${id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.className}>{classData?.name}</Text>
        {classData?.description && (
          <Text style={styles.description}>{classData.description}</Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="help-circle" size={32} color="#6366f1" />
          <Text style={styles.statNumber}>{questions.length}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
      </View>

      <View style={styles.permissionsSection}>
        <Text style={styles.sectionTitle}>Permissions</Text>
        <View style={styles.permissionRow}>
          <Ionicons
            name={locationStatus === 'granted' ? 'checkmark-circle' : 'location'}
            size={24}
            color={locationStatus === 'granted' ? '#22c55e' : '#f59e0b'}
          />
          <Text style={styles.permissionText}>Location Access</Text>
          {locationStatus !== 'granted' && (
            <TouchableOpacity
              style={styles.enableButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.enableButtonText}>Enable</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.startButton, questions.length === 0 && styles.startButtonDisabled]}
        onPress={startSession}
        disabled={questions.length === 0}
      >
        <Ionicons name="play" size={24} color="#fff" />
        <Text style={styles.startButtonText}>Start Learning Session</Text>
      </TouchableOpacity>

      <View style={styles.safetyNote}>
        <Ionicons name="warning" size={20} color="#f59e0b" />
        <Text style={styles.safetyText}>
          Safety First: Only use this app when it's safe. Pull over if needed.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 24,
    paddingTop: 48,
  },
  className: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    marginTop: -32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  permissionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  permissionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  enableButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enableButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    margin: 16,
    padding: 18,
    borderRadius: 12,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  safetyText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
  },
});
