import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useState } from "react";
import { router } from "expo-router";

export default function ProfileScreen() {
  const [useCloudModel, setUseCloudModel] = useState(true);

  const handleLogout = () => {
    // API: clear store/jwt
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Account Information</Text>
        <Text style={styles.text}>Dr. Sarah Jenkins</Text>
        <Text style={styles.subtext}>Cardiology Dept</Text>
        <Text style={styles.subtext}>Voice Model Trained ✓</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Preferences</Text>
        
        <View style={styles.row}>
          <Text>Use Cloud Models (Better Accuracy)</Text>
          <Switch value={useCloudModel} onValueChange={setUseCloudModel} />
        </View>
        <Text style={styles.hint}>
          Toggle between local Whisper models vs cloud AI APIs.
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  section: { marginBottom: 30, backgroundColor: "#fff", padding: 15, borderRadius: 8 },
  sectionHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 10, borderBottomWidth: 1, borderColor: "#eee", paddingBottom: 5 },
  text: { fontSize: 16, fontWeight: "500" },
  subtext: { color: "#666", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 10 },
  hint: { fontSize: 12, color: "#888", fontStyle: "italic" },
  logoutBtn: { backgroundColor: "#FF4B4B", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 }
});