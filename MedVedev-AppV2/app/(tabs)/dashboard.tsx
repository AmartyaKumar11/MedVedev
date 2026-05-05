import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Modal } from "react-native";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { fetchPatientsApi, Patient } from "../api/patient.api";
import { logoutApi } from "../api/auth.api";
import { getDoctorName, getToken } from "../api/tokenStore";

export default function DashboardScreen() {
  const [darkLabel, setDarkLabel] = useState("Dark");
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");

  const doctorName = getDoctorName() ?? "Doctor";

  // Fetch patients from the backend when the screen mounts
  useEffect(() => {
    if (!getToken()) {
      router.replace('/(auth)/login');
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);
    fetchPatientsApi()
      .then((data) => mounted && setPatients(data))
      .catch((err) => {
        if (!mounted) return;
        const msg = err?.response?.data?.detail ?? err?.message ?? "Failed to load patients.";
        setError(String(msg));
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const handleSelectPatient = (id: string, name: string) => {
    router.push({
      pathname: '/patient/[id]',
      params: { id, name }
    });
  };

  const handleLogout = () => {
    logoutApi();
    router.replace("/(auth)/login");
  };

  const handleCreatePatient = () => {
    if (!newPatientName.trim()) {
      Alert.alert("Error", "Patient name cannot be empty.");
      return;
    }
    setModalVisible(false);
    router.push({
      pathname: "/(tabs)/consultation",
      params: { patientName: newPatientName.trim() },
    });
    setNewPatientName("");
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [query, patients]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.mainGrid}>
        <View style={styles.sidebar}>
          <View>
            <Text style={styles.brand}>MEDVEDEV V2</Text>
            <Text style={styles.brandSub}>Clinical Conversation Intelligence</Text>
          </View>

          <View style={styles.navStack}>
            <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]}>
              <Text style={styles.navBtnTextActive}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn}>
              <Text style={styles.navBtnText}>Patients</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn}>
              <Text style={styles.navBtnText}>Sessions</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentColumn}>
          <View style={styles.topbar}>
            <View>
              <Text style={styles.topKicker}>DASHBOARD</Text>
              <Text style={styles.topTitle}>Dr. {doctorName}</Text>
            </View>

            <View style={styles.topbarRight}>
              <Text style={styles.topMeta}>Doctor ID authenticated</Text>
              <TouchableOpacity
                style={styles.darkPill}
                onPress={() => setDarkLabel((v) => (v === "Dark" ? "Light" : "Dark"))}
              >
                <Text style={styles.darkPillText}>{darkLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.patientPanel}>
            <View style={styles.panelHead}>
              <View>
                <Text style={styles.panelTitle}>Patients</Text>
                <Text style={styles.panelSub}>Search and start a consultation.</Text>
              </View>
              <View style={styles.panelHeadRight}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search patients..."
                  placeholderTextColor="#708075"
                  value={query}
                  onChangeText={setQuery}
                />
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                  <Text style={styles.addBtnText}>Add New Patient</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#3f6f48" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <FlatList
                data={filteredPatients}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.patientRow}>
                    <TouchableOpacity style={styles.card} onPress={() => handleSelectPatient(item.id, item.name)}>
                      <View>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.sub}>Since {new Date(item.created_at).toLocaleDateString()}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.patientActions}>
                      <TouchableOpacity onPress={() => handleSelectPatient(item.id, item.name)}>
                        <Text style={styles.historyLink}>History</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.consultBtn}
                        onPress={() => router.push({
                          pathname: "/(tabs)/consultation",
                          params: { patientId: item.id, patientName: item.name },
                        })}
                      >
                        <Text style={styles.consultBtnText}>Start Consultation</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No patients found.</Text>}
              />
            )}
          </View>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Patient</Text>
            <Text style={styles.modalText}>Enter the new patient's name to start a session.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Patient Full Name"
              value={newPatientName}
              onChangeText={setNewPatientName}
              autoCapitalize="words"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleCreatePatient}>
                <Text style={styles.modalBtnTextSave}>Start Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef2ee",
  },
  container: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  mainGrid: {
    gap: 12,
  },
  sidebar: {
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 16,
    backgroundColor: "#f7faf6",
    padding: 12,
    minHeight: 320,
    justifyContent: "space-between",
  },
  brand: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#6f7d72",
    fontWeight: "700",
  },
  brandSub: {
    marginTop: 6,
    color: "#516253",
    fontSize: 14,
  },
  navStack: {
    marginTop: 16,
    gap: 8,
  },
  navBtn: {
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 13,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  navBtnActive: {
    borderColor: "#c0cbc2",
    backgroundColor: "#dce5dc",
  },
  navBtnText: {
    color: "#4d5f51",
    fontWeight: "600",
    fontSize: 16,
  },
  navBtnTextActive: {
    color: "#34453a",
    fontWeight: "700",
    fontSize: 16,
  },
  logoutBtn: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#c2cdc4",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#f5f9f4",
  },
  logoutText: {
    color: "#3a4b3f",
    fontWeight: "700",
  },
  contentColumn: {
    gap: 12,
  },
  topbar: {
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 16,
    backgroundColor: "#f7faf6",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topKicker: {
    color: "#748176",
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: "600",
  },
  topTitle: {
    marginTop: 3,
    fontSize: 35,
    color: "#1f2a21",
    fontWeight: "800",
  },
  topbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topMeta: {
    color: "#5f7061",
    fontSize: 12,
    fontWeight: "600",
  },
  darkPill: {
    borderWidth: 1,
    borderColor: "#c0cbc2",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#f4f8f3",
  },
  darkPillText: {
    color: "#2d3930",
    fontWeight: "700",
  },
  patientPanel: {
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 16,
    backgroundColor: "#f7faf6",
    padding: 12,
  },
  panelHead: {
    gap: 10,
  },
  panelTitle: {
    color: "#273429",
    fontWeight: "700",
    fontSize: 23,
  },
  panelSub: {
    marginTop: 3,
    color: "#5d6e60",
  },
  panelHeadRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#b9c6bb",
    borderRadius: 14,
    backgroundColor: "#f4f8f3",
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: "#203025",
  },
  addBtn: {
    backgroundColor: "#3f6f48",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  addBtnText: {
    color: "#f1f7f0",
    fontWeight: "700",
  },
  patientRow: {
    marginTop: 12,
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 14,
    backgroundColor: "#f5f9f4",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patientActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#253227",
  },
  sub: {
    fontSize: 13,
    color: "#5b6b5d",
    marginTop: 4,
  },
  ageText: {
    color: "#6d7e6f",
    fontWeight: "600",
  },
  historyLink: {
    color: "#3d4d40",
    fontWeight: "600",
  },
  consultBtn: {
    borderWidth: 1,
    borderColor: "#b8c5ba",
    borderRadius: 14,
    backgroundColor: "#f6faf5",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  consultBtnText: {
    color: "#334438",
    fontWeight: "700",
  },
  empty: {
    marginTop: 14,
    color: "#5b6b5e",
  },
  errorText: {
    marginTop: 14,
    color: "#c0392b",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#e0b0aa",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fdf0ef",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 320,
    backgroundColor: "#f7faf6",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#253227",
    marginBottom: 6,
  },
  modalText: {
    fontSize: 14,
    color: "#5b6b5e",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#b9c6bb",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fcfdfc",
    fontSize: 16,
    color: "#203025",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#eef2ee",
  },
  modalBtnTextCancel: {
    color: "#5b6b5e",
    fontWeight: "600",
  },
  modalBtnSave: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#3f6f48",
  },
  modalBtnTextSave: {
    color: "#f1f7f0",
    fontWeight: "700",
  },
});
