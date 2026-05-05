import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getSessionsApi } from '../../api/session.api';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/colors';
import { Session } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SessionsStackParamList } from '../../types';

export default function SessionHistoryScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<SessionsStackParamList>>();

  useEffect(() => {
    getSessionsApi().then((data) => { setSessions(data); setLoading(false); });
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Past Sessions</Text>}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Loading...' : 'No sessions yet.'}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}>
            <Card style={styles.row}>
              <Ionicons name="document-text-outline" size={28} color={Colors.primary} />
              <View style={styles.rowInfo}>
                <Text style={styles.date}>{new Date(item.startedAt).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                <Text style={styles.time}>{new Date(item.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                {item.durationSeconds && <Text style={styles.dur}>{Math.round(item.durationSeconds / 60)} min</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  empty: { textAlign: 'center', color: Colors.textLight, marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowInfo: { flex: 1 },
  date: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  time: { fontSize: 12, color: Colors.textSecondary },
  dur: { fontSize: 12, color: Colors.secondary, marginTop: 2 },
});
