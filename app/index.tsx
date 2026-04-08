import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const [darkLabel, setDarkLabel] = useState("Dark");

  const features = [
    {
      title: "Speaker Diarization",
      desc: "Doctor / patient labeling for clinical clarity.",
    },
    {
      title: "Multilingual Transcription",
      desc: "Handles mixed-language symptom descriptions.",
    },
    {
      title: "SOAP Note Generation",
      desc: "Structured notes: subjective -> plan.",
    },
    {
      title: "PDF Reports",
      desc: "Clean exports for documentation and sharing.",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>MEDVEDEV</Text>
          <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.ghostPill}
            onPress={() => setDarkLabel((v) => (v === "Dark" ? "Light" : "Dark"))}
          >
            <Text style={styles.ghostPillText}>{darkLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}> 
            <Text style={styles.linkBtn}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(auth)/register")}> 
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.heroWrap}>
        <View style={styles.heroLeft}>
          <Text style={styles.kicker}>CLINICAL CONVERSATION INTELLIGENCE</Text>
          <Text style={styles.title}>MEDVEDEV</Text>
          <Text style={styles.subtitle}>
            Speaker-aware transcription and clinical summarization, designed for calm,
            clean workflows-ready for backend integration when you are.
          </Text>

          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(auth)/register")}> 
              <Text style={styles.primaryBtnText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push("/(tabs)/dashboard")}> 
              <Text style={styles.outlineBtnText}>View Dashboard</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badgeGrid}>
            <Text style={styles.badge}>Speaker Diarization</Text>
            <Text style={styles.badge}>Multilingual Transcription</Text>
            <Text style={styles.badge}>SOAP Note Generation</Text>
            <Text style={styles.badge}>PDF Reports</Text>
          </View>
        </View>

        <View style={styles.featurePanel}>
          <Text style={styles.panelKicker}>FEATURES</Text>
          {features.map((item) => (
            <View key={item.title} style={styles.featureItem}>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 MEDVEDEV</Text>
        <Text style={styles.footerText}>Pure dark UI · Glass panels · Mock data only</Text>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef2ee",
  },
  screen: {
    flex: 1,
    backgroundColor: "#eef2ee",
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  brand: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#6f7b70",
    fontWeight: "600",
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ghostPill: {
    borderWidth: 1,
    borderColor: "#c6d0c7",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f5f8f4",
  },
  ghostPillText: {
    color: "#2d3630",
    fontWeight: "600",
  },
  linkBtn: {
    color: "#1e2721",
    fontWeight: "600",
  },
  heroWrap: {
    gap: 14,
  },
  heroLeft: {
    gap: 10,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 2.6,
    color: "#748177",
    marginTop: 6,
  },
  title: {
    fontSize: 44,
    fontWeight: "800",
    color: "#17221b",
  },
  subtitle: {
    fontSize: 16,
    color: "#4f5f52",
    lineHeight: 26,
    maxWidth: 610,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: "#3f6f48",
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 20,
  },
  primaryBtnText: {
    color: "#f4f7f2",
    fontWeight: "700",
    fontSize: 18,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: "#b8c5ba",
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 20,
    backgroundColor: "#f7faf7",
  },
  outlineBtnText: {
    color: "#2e3931",
    fontSize: 18,
    fontWeight: "600",
  },
  badgeGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  badge: {
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: "#f4f8f3",
    color: "#46574a",
    width: "48.5%",
  },
  featurePanel: {
    borderWidth: 1,
    borderColor: "#c4cec6",
    borderRadius: 18,
    backgroundColor: "#f6f9f5",
    padding: 14,
    marginTop: 8,
  },
  panelKicker: {
    fontSize: 11,
    letterSpacing: 2.2,
    color: "#778479",
    marginBottom: 8,
  },
  featureItem: {
    borderWidth: 1,
    borderColor: "#c4cec6",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f3f7f2",
  },
  featureTitle: {
    fontSize: 20,
    color: "#243027",
    fontWeight: "700",
    marginBottom: 4,
  },
  featureDesc: {
    color: "#536355",
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderColor: "#cbd6cd",
    paddingTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  footerText: {
    color: "#6f7d71",
    fontSize: 12,
  },
});
