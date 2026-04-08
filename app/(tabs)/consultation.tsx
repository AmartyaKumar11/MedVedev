import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import { router } from "expo-router";

export default function ConsultationScreen() {
  const [recording, setRecording] = useState(false);
  const [darkLabel, setDarkLabel] = useState("Dark");
  const [transcript, setTranscript] = useState<any[]>([]);
  const [soapText, setSoapText] = useState("");

  const toggleRecording = () => {
    setRecording(!recording);
    if (!recording) {
      // API Start streaming audio
      setTranscript([
        { speaker: "Doctor", text: "Hello John, how have you been feeling since the last checkup?" },
      ]);
      setSoapText("");
      setTimeout(() => {
        setTranscript(prev => [...prev, { speaker: "Patient", text: "A bit of chest tightness in the mornings." }]);
        setSoapText("Subjective: Mild chest tightness in morning.\nObjective: Stable vitals.\nAssessment: Likely low-risk non-cardiac chest discomfort.\nPlan: Observe symptoms and follow-up.");
      }, 3000);
    } else {
      router.push("/session/123-latest"); // Navigate to session breakdown
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.mainGrid}>
        <View style={styles.sidebar}>
          <View>
            <Text style={styles.brand}>MEDVEDEV V2</Text>
            <Text style={styles.brandSub}>Clinical Conversation Intelligence</Text>
          </View>

          <View style={styles.navStack}>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.push("/(tabs)/dashboard")}>
              <Text style={styles.navBtnText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.push("/(tabs)/dashboard")}>
              <Text style={styles.navBtnText}>Patients</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]}>
              <Text style={styles.navBtnTextActive}>Sessions</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentColumn}>
          <View style={styles.topbar}>
            <View>
              <Text style={styles.topKicker}>DASHBOARD</Text>
              <Text style={styles.topTitle}>Consultation</Text>
            </View>
            <View style={styles.topbarRight}>
              <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}> 
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.darkPill}
                onPress={() => setDarkLabel((v) => (v === "Dark" ? "Light" : "Dark"))}
              >
                <Text style={styles.darkPillText}>{darkLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.liveCard}>
            <View style={styles.liveCardHead}>
              <View>
                <Text style={styles.liveKicker}>CONSULTATION</Text>
                <Text style={styles.liveTitle}>Live Capture</Text>
              </View>
              <Text style={styles.idleBadge}>{recording ? "RECORDING" : "IDLE"}</Text>
            </View>

            <View style={styles.micCenterOuter}>
              <View style={styles.micCenterInner} />
            </View>

            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.recordBtn, recording && styles.recordingBtn]}
                onPress={toggleRecording}
              >
                <Text style={styles.recordText}>{recording ? "Stop Recording" : "Start Recording"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopBtn} onPress={toggleRecording}>
                <Text style={styles.stopText}>Stop Recording</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRecording(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.motionHint}>Subtle motion. No bright accents.</Text>
            </View>
          </View>

          <View style={styles.bottomCardsRow}>
            <View style={styles.bottomCard}>
              <View style={styles.bottomCardHead}>
                <Text style={styles.bottomTitle}>Transcript</Text>
                <Text style={styles.bottomTag}>SPEAKER DIARIZATION</Text>
              </View>
              <View style={styles.transcriptArea}>
                <ScrollView>
                  {transcript.length === 0 ? (
                    <Text style={styles.empty}>No transcript yet.</Text>
                  ) : (
                    transcript.map((line, idx) => (
                      <View key={idx} style={styles.lineRow}>
                        <Text style={[styles.speaker, line.speaker === "Doctor" ? styles.doctor : styles.patient]}>
                          {line.speaker}
                        </Text>
                        <Text style={styles.text}>{line.text}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>

            <View style={styles.bottomCard}>
              <View style={styles.bottomCardHead}>
                <Text style={styles.bottomTitle}>SOAP Note</Text>
                <Text style={styles.bottomTag}>GENERATED</Text>
              </View>
              <Text style={styles.soapText}>{soapText || "No SOAP note yet."}</Text>
            </View>
          </View>

          <View style={styles.generateWrap}>
            <TouchableOpacity style={styles.generateBtn} onPress={() => alert("Report generated")}> 
              <Text style={styles.generateText}>Generate Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  backText: {
    color: "#35463a",
    fontWeight: "700",
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
  liveCard: {
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 16,
    backgroundColor: "#f7faf6",
    padding: 12,
  },
  liveCardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveKicker: {
    color: "#748176",
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: "600",
  },
  liveTitle: {
    marginTop: 3,
    fontSize: 34,
    color: "#253128",
    fontWeight: "800",
  },
  idleBadge: {
    borderWidth: 1,
    borderColor: "#c0cbc2",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    color: "#748176",
    fontWeight: "700",
    letterSpacing: 1.5,
    fontSize: 11,
  },
  micCenterOuter: {
    marginVertical: 18,
    alignSelf: "center",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f1f6f0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1e251f",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
  },
  micCenterInner: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#d8e2d8",
    borderWidth: 1,
    borderColor: "#c7d2c9",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  recordBtn: {
    backgroundColor: "#3f6f48",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  recordingBtn: {
    backgroundColor: "#6c8f74",
  },
  recordText: {
    color: "#f2f7f1",
    fontWeight: "700",
  },
  stopBtn: {
    borderWidth: 1,
    borderColor: "#c0cbc2",
    backgroundColor: "#f4f8f3",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  stopText: {
    color: "#778479",
    fontWeight: "700",
  },
  cancelText: {
    color: "#6f7f73",
    fontWeight: "600",
  },
  motionHint: {
    color: "#6f7e72",
    fontWeight: "600",
    marginLeft: "auto",
  },
  bottomCardsRow: {
    gap: 10,
  },
  bottomCard: {
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 16,
    backgroundColor: "#f7faf6",
    padding: 12,
    minHeight: 120,
  },
  bottomCardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomTitle: {
    color: "#273429",
    fontSize: 26,
    fontWeight: "700",
  },
  bottomTag: {
    color: "#758377",
    letterSpacing: 1.8,
    fontSize: 10,
    fontWeight: "700",
  },
  transcriptArea: {
    marginTop: 8,
    maxHeight: 160,
  },
  empty: {
    color: "#5e6f61",
    fontSize: 14,
  },
  lineRow: {
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 11,
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#f3f7f2",
  },
  speaker: {
    fontWeight: "700",
    marginBottom: 3,
    fontSize: 12,
  },
  doctor: {
    color: "#31483a",
  },
  patient: {
    color: "#43614a",
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
    color: "#2c3b2f",
  },
  soapText: {
    marginTop: 8,
    color: "#4e5f52",
    lineHeight: 20,
  },
  generateWrap: {
    alignItems: "flex-end",
  },
  generateBtn: {
    backgroundColor: "#95aa99",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  generateText: {
    color: "#f2f7f1",
    fontWeight: "700",
  },
});