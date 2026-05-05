import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { getSpeakersApi } from '../../api/enrollment.api';
import { getSessionsApi } from '../../api/session.api';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/colors';
import { SpeakerProfile, Session } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const doctor = useAuthStore((s) => s.doctor);
  const [speakers, setSpeakers] = useState<SpeakerProfile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    getSpeakersApi().then(setSpeakers);
    getSessionsApi().then(setSessions);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Good day, {doctor?.name ?? 'Doctor'} 👋</Text>
      <Text style={styles.sub}>Clinical Consultation Dashboard</Text>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Ionicons name="people" size={24} color={Colors.primary} />
          <Text style={styles.statNumber}>{speakers.length}</Text>
          <Text style={styles.statLabel}>Enrolled Voices</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="document-text" size={24} color={Colors.secondary} />
          <Text style={styles.statNumber}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Recent Sessions</Text>
      {sessions.slice(0, 3).map((session) => (
        <Card key={session.id}>
          <Text style={styles.sessionDate}>{new Date(session.startedAt).toLocaleDateString()}</Text>
          <Text style={styles.sessionDuration}>
            {session.durationSeconds ? `${Math.round(session.durationSeconds / 60)} min` : 'In progress'}
          </Text>
        </Card>
      ))}

      <Text style={styles.sectionTitle}>Enrolled Speakers</Text>
      {speakers.map((s) => (
        <Card key={s.id} style={styles.speakerRow}>
          <Ionicons name="person-circle" size={32} color={Colors.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.speakerName}>{s.name}</Text>
            <Text style={styles.speakerSamples}>{s.sampleCount} voice samples</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 20, marginBottom: 8 },
  sessionDate: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  sessionDuration: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  speakerRow: { flexDirection: 'row', alignItems: 'center' },
  speakerName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  speakerSamples: { fontSize: 12, color: Colors.textSecondary },
});
