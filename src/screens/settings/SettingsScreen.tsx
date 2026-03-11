import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

const WHISPER_MODELS = ['tiny', 'base', 'small', 'medium', 'large'] as const;
const LANGUAGES = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
];

export default function SettingsScreen() {
  const { whisperModel, setWhisperModel, language, setLanguage } = useSettingsStore();
  const logout = useAuthStore((s) => s.logout);
  const doctor = useAuthStore((s) => s.doctor);

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <Card>
        <Text style={styles.label}>Logged in as</Text>
        <Text style={styles.value}>{doctor?.name}</Text>
        <Text style={styles.subValue}>{doctor?.email}</Text>
      </Card>

      <Text style={styles.section}>Whisper Model</Text>
      {WHISPER_MODELS.map((model) => (
        <Card key={model} style={styles.row}>
          <Text style={styles.optionLabel}>{model.charAt(0).toUpperCase() + model.slice(1)}</Text>
          <Switch value={whisperModel === model} onValueChange={() => setWhisperModel(model)} thumbColor={Colors.primary} />
        </Card>
      ))}

      <Text style={styles.section}>Transcription Language</Text>
      {LANGUAGES.map((lang) => (
        <Card key={lang.code} style={styles.row}>
          <Text style={styles.optionLabel}>{lang.label}</Text>
          <Switch value={language === lang.code} onValueChange={() => setLanguage(lang.code)} thumbColor={Colors.primary} />
        </Card>
      ))}

      <Button title="Logout" onPress={handleLogout} variant="danger" style={styles.logoutBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  section: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  value: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  subValue: { fontSize: 13, color: Colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionLabel: { fontSize: 15, color: Colors.textPrimary },
  logoutBtn: { marginTop: 32, backgroundColor: Colors.danger },
});
