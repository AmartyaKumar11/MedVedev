import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { fetchPatientSessionsApi, PatientSession } from "../api/patient.api";
import { API_BASE_URL } from "../api/config";
import { getToken } from "../api/tokenStore";

export default function PatientDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [sessions, setSessions] = useState<PatientSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/(auth)/login');
      return;
    }
    if (!id) return;
    let mounted = true;
    setLoading(true);
    fetchPatientSessionsApi(String(id))
      .then((data) => mounted && setSessions(data))
      .catch((err) => {
        if (!mounted) return;
        const msg = err?.response?.data?.detail ?? err?.message ?? "Failed to load sessions.";
        setError(String(msg));
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Patient: {name}</Text>
      <Text style={styles.sub}>ID: {id}</Text>

      <Text style={styles.sectionHeader}>Session History</Text>

      {loading ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 20 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.session_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                if (item.pdf_url) {
                  const { Linking } = require("react-native");
                  Linking.openURL(`${API_BASE_URL}${item.pdf_url}`);
                } else {
                  router.push(`/session/${item.session_id}`);
                }
              }}
            >
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
              <Text style={styles.synopsis}>Session {item.session_id.slice(0, 8)}…</Text>
              {item.pdf_url ? (
                <Text style={styles.pdfLink}>📄 PDF available</Text>
              ) : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No sessions recorded yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f8f9fa" },
  backBtn: { marginBottom: 10 },
  backText: { color: "#2563eb", fontWeight: "600", fontSize: 15 },
  header: { fontSize: 24, fontWeight: "bold" },
  sub: { fontSize: 16, color: "#666", marginBottom: 20 },
  sectionHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 10, marginTop: 10 },
  card: { padding: 15, backgroundColor: "#fff", borderRadius: 8, marginBottom: 10, elevation: 1 },
  date: { fontWeight: "bold", fontSize: 16, color: "#2563eb" },
  synopsis: { fontSize: 14, color: "#444", marginTop: 4 },
  pdfLink: { fontSize: 12, color: "#3f6f48", marginTop: 4 },
  empty: { color: "#666", marginTop: 10 },
  errorText: {
    color: "#c0392b",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#e0b0aa",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fdf0ef",
    marginTop: 10,
  },
});