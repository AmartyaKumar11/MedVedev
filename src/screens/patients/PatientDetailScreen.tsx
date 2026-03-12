import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { PatientsStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  route: RouteProp<PatientsStackParamList, 'PatientDetail'>;
  navigation: NativeStackNavigationProp<PatientsStackParamList, 'PatientDetail'>;
};

export default function PatientDetailScreen({ route, navigation }: Props) {
  const { patientId, patientName } = route.params;

  return (
    <View style={styles.container}>
      {/* Patient Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{patientName.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{patientName}</Text>
        <Text style={styles.idLabel}>Patient ID: {patientId}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionCard, styles.recordCard]}
          onPress={() => navigation.navigate('RecordReport', { patientId, patientName })}
          activeOpacity={0.85}
        >
          <Ionicons name="mic-circle" size={48} color={Colors.white} />
          <Text style={styles.actionTitle}>Record Report</Text>
          <Text style={styles.actionSub}>Add notes for this consultation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.viewCard]}
          onPress={() => navigation.navigate('ViewReports', { patientId, patientName })}
          activeOpacity={0.85}
        >
          <Ionicons name="document-text" size={48} color={Colors.white} />
          <Text style={styles.actionTitle}>View Reports</Text>
          <Text style={styles.actionSub}>See all saved reports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24 },
  header: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { color: Colors.white, fontSize: 32, fontWeight: '800' },
  name: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  idLabel: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'column', gap: 16, marginTop: 8 },
  actionCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  recordCard: { backgroundColor: Colors.primary },
  viewCard: { backgroundColor: Colors.secondary },
  actionTitle: { color: Colors.white, fontSize: 20, fontWeight: '700', marginTop: 10 },
  actionSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
});
