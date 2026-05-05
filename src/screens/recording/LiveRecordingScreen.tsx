import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { MicButton } from '../../components/recording/MicButton';
import { TranscriptFeed } from '../../components/transcript/TranscriptFeed';
import { useSessionStore } from '../../store/sessionStore';
import { useAuthStore } from '../../store/authStore';
import { startSessionApi, finalizeSessionApi } from '../../api/session.api';
import { Colors } from '../../constants/colors';
import { MOCK_TRANSCRIPT } from '../../mocks/mockData';
import { TranscriptSegment } from '../../types';

let mockInterval: ReturnType<typeof setInterval> | null = null;
let mockIndex = 0;

export default function LiveRecordingScreen() {
  const { isRecording, transcript, setRecording, appendSegment, setActiveSession, clearSession, activeSession } = useSessionStore();
  const doctor = useAuthStore((s) => s.doctor);
  const [elapsed, setElapsed] = useState(0);

  async function handleMicPress() {
    if (isRecording) {
      // Stop
      setRecording(false);
      if (mockInterval) { clearInterval(mockInterval); mockInterval = null; }
      if (activeSession) {
        await finalizeSessionApi(activeSession.id);
      }
      Alert.alert('Session Saved', 'Your consultation transcript has been saved.');
      clearSession();
      setElapsed(0);
      mockIndex = 0;
    } else {
      // Start
      clearSession();
      mockIndex = 0;
      const session = await startSessionApi(doctor?.id ?? 'doc-001');
      setActiveSession(session);
      setRecording(true);

      // Simulate streaming transcript segments from mock data
      mockInterval = setInterval(() => {
        const seg: TranscriptSegment = {
          ...MOCK_TRANSCRIPT[mockIndex % MOCK_TRANSCRIPT.length],
          id: `live-${Date.now()}`,
          sessionId: session.id,
          startTime: mockIndex * 3.5,
          endTime: mockIndex * 3.5 + 3.2,
        };
        appendSegment(seg);
        mockIndex++;
        setElapsed((prev) => prev + 3);
      }, 3500);
    }
  }

  const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Recording</Text>
        {isRecording && (
          <View style={styles.recBadge}>
            <Text style={styles.recDot}>●</Text>
            <Text style={styles.recText}>{minutes}:{seconds}</Text>
          </View>
        )}
      </View>

      <View style={styles.feed}>
        <TranscriptFeed segments={transcript} emptyMessage="Tap the mic to start recording..." />
      </View>

      <View style={styles.controls}>
        <Text style={styles.hint}>{isRecording ? 'Tap to stop' : 'Tap to start'}</Text>
        <MicButton isRecording={isRecording} onPress={handleMicPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  recBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDECEA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  recDot: { color: Colors.recording, fontSize: 10, marginRight: 4 },
  recText: { color: Colors.recording, fontWeight: '700', fontSize: 13 },
  feed: { flex: 1, backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  controls: { alignItems: 'center', paddingVertical: 28 },
  hint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
});
