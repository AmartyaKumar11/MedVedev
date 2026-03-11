import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
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
  route: RouteProp<PatientsStackParamList, 'ViewReports'>;
  navigation: NativeStackNavigationProp<PatientsStackParamList, 'ViewReports'>;
};

export default function ViewReportsScreen({ route }: Props) {
  const { patientId, patientName } = route.params;
  const getRecordings = usePatientStore((s) => s.getRecordings);
  const recordings = getRecordings(patientId);

  const [playingId, setPlayingId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const soundRef = React.useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  async function handlePlay(id: string, audioUri: string) {
    // Mock URIs (from simulator fallback) can't be played
    if (audioUri.startsWith('mock://')) {
      Alert.alert('Simulator Recording', 'This recording was made on a simulator without microphone. Playback is only available on a real device.');
      return;
    }
    // If tapping the already-playing item, stop it
    if (playingId === id) {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setPlayingId(null);
      return;
    }
    // Stop any currently playing sound
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    const Audio = getAudio();
    if (!Audio) {
      Alert.alert('Playback Unavailable', 'Audio playback is not supported in this environment.');
      return;
    }
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingId(id);
      sound.setOnPlaybackStatusUpdate((status: { isLoaded: boolean; didJustFinish?: boolean }) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
          setPlayingId(null);
        }
      });
    } catch {
      Alert.alert('Playback Error', 'Could not play this recording.');
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
  }

  function formatDuration(ms: number) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerBox}>
            <Text style={styles.title}>Recordings</Text>
            <Text style={styles.subtitle}>Patient: {patientName}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mic-off-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No Recordings Yet</Text>
            <Text style={styles.emptySub}>
              Tap "Record Report" on the patient screen to add the first recording.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const isPlaying = playingId === item.id;
          return (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.recordingName}>{item.name}</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                {item.durationMs > 0 && (
                  <Text style={styles.duration}>{formatDuration(item.durationMs)}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.playBtn, isPlaying && styles.playBtnActive]}
                onPress={() => handlePlay(item.id, item.audioUri)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isPlaying ? 'stop' : 'play'}
                  size={22}
                  color={Colors.white}
                />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 20, paddingBottom: 40 },
  headerBox: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.textLight, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: { flex: 1 },
  recordingName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  duration: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  playBtnActive: { backgroundColor: Colors.danger },
});
