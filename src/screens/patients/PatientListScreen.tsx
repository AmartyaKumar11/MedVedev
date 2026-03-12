import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientsStackParamList } from '../../types';
import { usePatientStore } from '../../store/patientStore';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<PatientsStackParamList, 'PatientList'>;

export default function PatientListScreen() {
  const navigation = useNavigation<Nav>();
  const patients = usePatientStore((s) => s.patients);
  const addPatient = usePatientStore((s) => s.addPatient);
  const [enrollVisible, setEnrollVisible] = useState(false);
  const [newName, setNewName] = useState('');

  function handleEnroll() {
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert('Name Required', 'Please enter a patient name.');
      return;
    }
    addPatient(trimmed);
    setNewName('');
    setEnrollVisible(false);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerBox}>
            <Text style={styles.title}>Enrolled Patients</Text>
            <Text style={styles.subtitle}>{patients.length} patients enrolled</Text>
            <TouchableOpacity
              style={styles.enrollBtn}
              onPress={() => setEnrollVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add" size={18} color={Colors.white} />
              <Text style={styles.enrollBtnText}>Enroll Patient</Text>
            </TouchableOpacity>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('PatientDetail', {
                patientId: item.id,
                patientName: item.name,
              })
            }
            activeOpacity={0.75}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        )}
      />

      {/* Enroll Patient Modal */}
      <Modal
        visible={enrollVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEnrollVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enroll New Patient</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Patient full name"
              placeholderTextColor={Colors.textLight}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleEnroll}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setNewName('');
                  setEnrollVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleEnroll}>
                <Text style={styles.modalSaveText}>Enroll</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 20 },
  headerBox: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  enrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 8,
    alignSelf: 'flex-start',
  },
  enrollBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  separator: { height: 10 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  modalCancelText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  modalSaveText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
