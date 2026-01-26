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
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

interface ClassDetails {
  id: string;
  name: string;
  description: string | null;
}

interface Material {
  id: string;
  title: string;
  file_type: string;
  processing_status: string;
}

interface Question {
  id: string;
  question_text: string;
}

export default function ClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!user || !id) return;

    const [classResult, materialsResult, questionsResult] = await Promise.all([
      supabase.from('classes').select('*').eq('id', id).single(),
      supabase.from('study_materials').select('*').eq('class_id', id).order('created_at', { ascending: false }),
      supabase.from('generated_questions').select('id, question_text').eq('class_id', id),
    ]);

    if (classResult.data) setClassData(classResult.data);
    if (materialsResult.data) setMaterials(materialsResult.data);
    if (questionsResult.data) setQuestions(questionsResult.data);
    setLoading(false);
  };

  const handleUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'text/plain'],
    });

    if (result.canceled || !result.assets?.[0]) return;

    const file = result.assets[0];
    setUploading(true);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user!.id}/${id}/${fileName}`;

      // Upload to storage
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Create record
      const { error: dbError } = await supabase
        .from('study_materials')
        .insert({
          class_id: id,
          user_id: user!.id,
          title: file.name,
          file_type: file.mimeType || 'application/pdf',
          file_path: filePath,
          file_size: file.size,
          processing_status: 'pending',
        });

      if (dbError) throw dbError;

      Alert.alert('Success', 'File uploaded. Processing will happen on web app.');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = (material: Material) => {
    Alert.alert('Delete File', `Delete "${material.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('generated_questions').delete().eq('study_material_id', material.id);
          await supabase.storage.from('study-materials').remove([material.id]);
          await supabase.from('study_materials').delete().eq('id', material.id);
          fetchData();
        },
      },
    ]);
  };

  const handleDeleteClass = () => {
    Alert.alert('Delete Class', `Delete "${classData?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('classes').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.className}>{classData?.name}</Text>
        {classData?.description && <Text style={styles.description}>{classData.description}</Text>}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{materials.length}</Text>
          <Text style={styles.statLabel}>Files</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{questions.length}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Study Materials</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.uploadBtnText}>{uploading ? 'Uploading...' : 'Upload'}</Text>
          </TouchableOpacity>
        </View>

        {materials.map((m) => (
          <View key={m.id} style={styles.materialRow}>
            <Ionicons name="document" size={20} color="#6366f1" />
            <View style={styles.materialInfo}>
              <Text style={styles.materialTitle} numberOfLines={1}>{m.title}</Text>
              <Text style={styles.materialStatus}>{m.processing_status}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteMaterial(m)}>
              <Ionicons name="trash" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        {materials.length === 0 && (
          <Text style={styles.emptyText}>No files uploaded yet</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generated Questions ({questions.length})</Text>
        {questions.slice(0, 5).map((q) => (
          <Text key={q.id} style={styles.questionText} numberOfLines={2}>
            • {q.question_text}
          </Text>
        ))}
        {questions.length > 5 && (
          <Text style={styles.moreText}>...and {questions.length - 5} more</Text>
        )}
        {questions.length === 0 && (
          <Text style={styles.emptyText}>Upload files to generate questions</Text>
        )}
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteClass}>
        <Ionicons name="trash" size={20} color="#ef4444" />
        <Text style={styles.deleteBtnText}>Delete Class</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#6366f1', padding: 20, paddingTop: 16 },
  className: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  description: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  stats: { flexDirection: 'row', padding: 16, gap: 12 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: 'bold', color: '#6366f1' },
  statLabel: { fontSize: 12, color: '#666' },
  section: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, gap: 4 },
  uploadBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  materialRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', gap: 10 },
  materialInfo: { flex: 1 },
  materialTitle: { fontSize: 14, color: '#333' },
  materialStatus: { fontSize: 12, color: '#666' },
  questionText: { fontSize: 14, color: '#555', marginVertical: 4 },
  moreText: { fontSize: 12, color: '#6366f1', marginTop: 8 },
  emptyText: { fontSize: 14, color: '#999', fontStyle: 'italic' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444', gap: 8 },
  deleteBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '500' },
});
