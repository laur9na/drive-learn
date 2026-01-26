import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
}

export default function Classes() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const { user, signOut } = useAuth();
  const router = useRouter();

  const fetchClasses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setClasses(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchClasses();
  }, [user]);

  const handleCreate = async () => {
    if (!newClassName.trim()) {
      Alert.alert('Error', 'Class name is required');
      return;
    }
    const { error } = await supabase.from('classes').insert({
      user_id: user!.id,
      name: newClassName.trim(),
      description: newClassDesc.trim() || null,
    });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setShowModal(false);
      setNewClassName('');
      setNewClassDesc('');
      fetchClasses();
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Classes</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
            <Ionicons name="add" size={24} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { signOut(); router.replace('/login'); }}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchClasses(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/classes/${item.id}`)}>
            <Ionicons name="book" size={24} color="#6366f1" />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.description && <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="school-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No classes yet</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.createBtnText}>Create Class</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Class</Text>
            <TextInput
              style={styles.input}
              placeholder="Class name"
              value={newClassName}
              onChangeText={setNewClassName}
            />
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={newClassDesc}
              onChangeText={setNewClassDesc}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                <Text style={styles.saveBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: '600', color: '#333' },
  headerBtns: { flexDirection: 'row', gap: 16 },
  addBtn: { marginRight: 8 },
  list: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, gap: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  createBtn: { marginTop: 16, backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  createBtnText: { color: '#fff', fontWeight: '600' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText: { color: '#666' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#6366f1', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
