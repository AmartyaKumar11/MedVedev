import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Alert } from 'react-native';
import { getSpeakersApi, enrollVoiceApi } from '../../api/enrollment.api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/colors';
import { SpeakerProfile } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function SpeakerEnrollmentScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakers, setSpeakers] = useState<SpeakerProfile[]>([]);

  useEffect(() => { getSpeakersApi().then(setSpeakers); }, []);

  async function handleEnroll() {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a speaker name.'); return; }
    setLoading(true);
    try {
      const profile = await enrollVoiceApi(name.trim(), '');
      setSpeakers((prev) => [...prev, profile]);
      setName('');
      Alert.alert('Enrolled!', `${profile.name} has been enrolled successfully.`);
    } catch {
      Alert.alert('Error', 'Enrollment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={speakers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Enroll Voice</Text>
            <Text style={styles.hint}>{'Record a 5-second voice sample for speaker identification.\n(Mock mode: no actual recording required)'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Speaker name (e.g. Dr. Smith, Patient)"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
            />
            <Button title={loading ? 'Enrolling...' : '🎤 Enroll Speaker'} onPress={handleEnroll} loading={loading} style={{ marginBottom: 24 }} />
            <Text style={styles.section}>Enrolled Speakers ({speakers.length})</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No speakers enrolled yet.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Ionicons name="person-circle" size={32} color={Colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.spName}>{item.name}</Text>
              <Text style={styles.spSamples}>{item.sampleCount} sample{item.sampleCount !== 1 ? 's' : ''}</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  hint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 14,
    fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary,
  },
  section: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  empty: { textAlign: 'center', color: Colors.textLight, marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  spName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  spSamples: { fontSize: 12, color: Colors.textSecondary },
});
