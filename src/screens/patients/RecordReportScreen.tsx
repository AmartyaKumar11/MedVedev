import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

// Lazy-load expo-av to avoid crashing when ExponentAV native module is missing
function getAudio() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Audio } = require('expo-av') as typeof import('expo-av');
    return Audio;
  } catch {
    return null;
  }
}
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { PatientsStackParamList } from '../../types';
import { usePatientStore } from '../../store/patientStore';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  route: RouteProp<PatientsStackParamList, 'RecordReport'>;
  navigation: NativeStackNavigationProp<PatientsStackParamList, 'RecordReport'>;
};

export default function RecordReportScreen({ route, navigation }: Props) {
  const { patientId, patientName } = route.params;
  const addRecording = usePatientStore((s) => s.addRecording);
  const getRecordings = usePatientStore((s) => s.getRecordings);

  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recordingRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-incrementing name for this recording
  const existingCount = getRecordings(patientId).length;
  const nextName = `${patientName} ${existingCount + 1}`;

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startRecording() {
    const Audio = getAudio();
    if (Audio) {
      try {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          Alert.alert('Permission Denied', 'Microphone permission is required to record audio.');
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
      } catch {
        // native module unavailable – fall through to mock timer below
      }
    }
    // Start timer (works for both real and mock recording)
    setIsRecording(true);
    setElapsedMs(0);
    timerRef.current = setInterval(() => setElapsedMs((e) => e + 100), 100);
  }

  async function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    let uri: string | null = null;
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        uri = recordingRef.current.getURI() ?? null;
      } catch { /* ignore */ }
      recordingRef.current = null;
    }
    setAudioUri(uri ?? `mock://recording-${Date.now()}`);
    setDurationMs(elapsedMs);
    setHasRecording(true);
    setIsRecording(false);
  }

  function handleSave() {
    if (!audioUri) return;
    addRecording(patientId, audioUri, durationMs);
    Alert.alert('Saved', `"${nextName}" saved successfully.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  function handleDiscard() {
    Alert.alert('Discard Recording', 'Are you sure you want to discard this recording?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setAudioUri(null);
          setHasRecording(false);
          setDurationMs(0);
          setElapsedMs(0);
        },
      },
    ]);
  }

  function formatTime(ms: number) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Recording</Text>
      <Text style={styles.subtitle}>Patient: {patientName}</Text>
      <Text style={styles.recordingName}>Will be saved as: {nextName}</Text>

      {/* Timer display */}
      <View style={styles.timerBox}>
        <Text style={styles.timer}>{formatTime(isRecording ? elapsedMs : durationMs)}</Text>
        {isRecording && <View style={styles.liveDot} />}
      </View>

      {/* Main record / stop button */}
      {!hasRecording ? (
        <TouchableOpacity
          style={[styles.micBtn, isRecording && styles.micBtnRecording]}
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isRecording ? 'stop-circle' : 'mic-circle'}
            size={88}
            color={Colors.white}
          />
          <Text style={styles.micLabel}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.doneBox}>
          <Ionicons name="checkmark-circle" size={88} color={Colors.secondary} />
          <Text style={styles.doneText}>Recording Ready</Text>
          <Text style={styles.doneDuration}>{formatTime(durationMs)}</Text>
        </View>
      )}

      {/* Save / Discard */}
      {hasRecording && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            <Text style={styles.discardText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="save-outline" size={20} color={Colors.white} />
            <Text style={styles.saveText}>Save Recording</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isRecording && !hasRecording && (
        <TouchableOpacity style={styles.cancelLink} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  subtitle: { fontSize: 14, color: Colors.textSecondary, alignSelf: 'flex-start' },
  recordingName: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 32,
    alignSelf: 'flex-start',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 40,
  },
  timer: { fontSize: 52, fontWeight: '200', color: Colors.textPrimary, letterSpacing: 4 },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.danger,
  },
  micBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 80,
    width: 160,
    height: 160,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  micBtnRecording: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
  },
  micLabel: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  doneBox: { alignItems: 'center', gap: 8 },
  doneText: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  doneDuration: { fontSize: 16, color: Colors.textSecondary },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 40,
    width: '100%',
  },
  discardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    paddingVertical: 14,
  },
  discardText: { color: Colors.danger, fontSize: 15, fontWeight: '700' },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
  },
  saveText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  cancelLink: { marginTop: 32 },
  cancelLinkText: { color: Colors.textSecondary, fontSize: 15 },
});
