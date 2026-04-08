import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

const SESSIONS = [
  { id: "s1", date: "2023-11-01", synopsis: "Initial Visit for Chest Pain" },
  { id: "s2", date: "2023-11-05", synopsis: "Follow-up - Lab results" },
];

export default function PatientDetailScreen() {
  const { id, name } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Patient: {name}</Text>
      <Text style={styles.sub}>ID: {id}</Text>

      <Text style={styles.sectionHeader}>Session History</Text>
      
      <FlatList 
        data={SESSIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push(`/session/${item.id}`)}
          >
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.synopsis}>{item.synopsis}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f8f9fa" },
  header: { fontSize: 24, fontWeight: "bold" },
  sub: { fontSize: 16, color: "#666", marginBottom: 20 },
  sectionHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 10, marginTop: 10 },
  card: { padding: 15, backgroundColor: "#fff", borderRadius: 8, marginBottom: 10, elevation: 1 },
  date: { fontWeight: "bold", fontSize: 16, color: "#2563eb" },
  synopsis: { fontSize: 14, color: "#444", marginTop: 4 }
});