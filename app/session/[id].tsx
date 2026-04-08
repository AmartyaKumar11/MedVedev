import { View, Text, StyleSheet, ScrollView, Button } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Session Review</Text>
      <Text style={styles.sub}>Session ID: {id}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>SOAP Note</Text>
        
        <Text style={styles.h3}>Subjective</Text>
        <Text style={styles.text}>Patient reports mild chest tightness in the mornings. No shortness of breath.</Text>

        <Text style={styles.h3}>Objective</Text>
        <Text style={styles.text}>BP 120/80, HR 85 bpm. Heart sounds normal. No edema.</Text>

        <Text style={styles.h3}>Assessment</Text>
        <Text style={styles.text}>Likely musculoskeletal or mild reflux. Low suspicion for acute coronary syndrome.</Text>

        <Text style={styles.h3}>Plan</Text>
        <Text style={styles.text}>Prescribed antacid formulation trial. Follow up in 2 weeks.</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Download PDF Report" onPress={() => alert('Downloading...')} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Full Transcript</Text>
        <Text style={styles.doctor}>Dr: How are you feeling?</Text>
        <Text style={styles.patient}>Patient: A bit tight in the chest.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f8f9fa" },
  header: { fontSize: 24, fontWeight: "bold" },
  sub: { fontSize: 16, color: "#666", marginBottom: 20 },
  card: { padding: 20, backgroundColor: "#fff", borderRadius: 8, marginBottom: 20, elevation: 1 },
  sectionHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 15, borderBottomWidth: 1, borderColor: "#eee", paddingBottom: 5 },
  h3: { fontWeight: "bold", fontSize: 16, marginTop: 10, color: "#333" },
  text: { fontSize: 15, color: "#555", marginTop: 3 },
  doctor: { color: "#2563eb", fontWeight: "bold", marginTop: 8 },
  patient: { color: "#16a34a", fontWeight: "bold", marginTop: 8 }
});
