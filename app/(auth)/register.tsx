import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from "react-native";
import { router } from "expo-router";
import { useState, useRef, useEffect } from "react";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [samples, setSamples] = useState([false, false, false]);
  const [recording, setRecording] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const script = `Hello, my name is Dr. [Your Name].\n\nI am recording this sample to help the system learn my voice for future consultations.\n\nToday I will describe a few common medical scenarios.\n\nA patient may come with fever, cough, and body aches for the past three days.\n\nAnother patient may complain of stomach pain, bloating, or discomfort after eating.\n\nSometimes patients describe symptoms in mixed languages like Hindi and English.\n\nFor example, they may say \"pet mein dard ho raha hai\" or \"sir bhaari lag raha hai\".\n\nIt is important for me to clearly understand their symptoms and ask follow-up questions.\n\nI may ask about duration, severity, and any associated symptoms.\n\nI also explain treatment options and lifestyle changes to the patient.\n\nThis recording should capture my natural speaking voice across different tones and sentences.\n\nThank you.`;

  const sampleCount = samples.filter(Boolean).length;

  const handleRegister = () => {
    if (sampleCount === 3) {
      router.replace("/(auth)/login");
    }
  };

  const startStopRecording = (index: number) => {
    if (recording === index) {
      setRecording(null);
      setSamples((prev) => prev.map((v, i) => (i === index ? true : v)));
      return;
    }
    setRecording(index);
  };

  const clearSample = (index: number) => {
    setSamples((prev) => prev.map((v, i) => (i === index ? false : v)));
    if (recording === index) {
      setRecording(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Text style={styles.brand}>MEDVEDEV V2</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} activeOpacity={0.7}> 
            <Text style={styles.topLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.mainGrid, { opacity: fadeAnim }]}>
          <View style={styles.leftCard}>
          <Text style={styles.kicker}>CREATE ACCOUNT</Text>
          <Text style={styles.header}>Doctor Enrollment</Text>
          <Text style={styles.helper}>
            Record three voice samples to personalize diarization and improve clinical accuracy.
          </Text>

          <Text style={styles.label}>DOCTOR NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Dr. -"
            placeholderTextColor="#708074"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>AGE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 38"
            placeholderTextColor="#708074"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#708074"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.scriptBox}>
            <Text style={styles.scriptKicker}>RECORDING SCRIPT (READ EXACTLY)</Text>
            <Text style={styles.scriptText}>{script}</Text>
          </View>

          <View style={styles.submitRow}>
            <Text style={styles.sampleCount}>Samples captured: {sampleCount}/3</Text>
            <TouchableOpacity
              style={[styles.submitBtn, sampleCount !== 3 && styles.submitBtnDisabled]}
              onPress={handleRegister}
              disabled={sampleCount !== 3}
            >
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rightStack}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.sampleCard}>
              <View style={styles.sampleTitleRow}>
                <Text style={styles.sampleTitle}>Audio Sample {i + 1}</Text>
                <Text style={styles.sampleRequired}>REQUIRED</Text>
              </View>

              <Text style={styles.sampleHint}>
                {i === 0
                  ? "Sample 1: keep the mic closer to your mouth."
                  : i === 1
                    ? "Sample 2: keep the mic a little farther."
                    : "Sample 3: keep the mic at an arm's distance."}
              </Text>

              <View style={styles.sampleActionsWrap}>
                <View style={styles.sampleActionCard}>
                  <Text style={styles.sampleActionLabel}>Sample {i + 1}</Text>
                  <Text style={styles.sampleStatus}>{recording === i ? "RECORDING" : "IDLE"}</Text>
                  <TouchableOpacity style={styles.recordBtn} onPress={() => startStopRecording(i)}>
                    <Text style={styles.recordBtnText}>{recording === i ? "Stop Recording" : "Start Recording"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => clearSample(i)}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.sampleActionCard}>
                  <Text style={styles.sampleActionLabel}>Upload Sample {i + 1}</Text>
                  <Text style={styles.sampleStatus}>{samples[i] ? "READY" : "EMPTY"}</Text>
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => setSamples((prev) => prev.map((v, idx) => (idx === i ? true : v)))}
                  >
                    <Text style={styles.uploadBtnText}>Choose audio file</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => clearSample(i)}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <Text style={styles.bottomNote}>You must provide exactly three audio samples to continue.</Text>
        </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef2ee",
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brand: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#6f7d72",
    fontWeight: "600",
  },
  topLink: {
    color: "#243028",
    fontSize: 16,
    fontWeight: "600",
  },
  mainGrid: {
    gap: 14,
  },
  leftCard: {
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 16,
    backgroundColor: "#f7faf6",
    padding: 14,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 2.4,
    color: "#768378",
    marginBottom: 6,
  },
  header: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1f2a21",
  },
  helper: {
    marginTop: 6,
    color: "#4f6152",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    letterSpacing: 2.6,
    color: "#738174",
    marginBottom: 5,
    marginTop: 7,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#b8c6ba",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: "#203025",
    backgroundColor: "#f4f8f3",
    fontSize: 14,
  },
  scriptBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 12,
    backgroundColor: "#f3f7f2",
    padding: 10,
  },
  scriptKicker: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#6f7e72",
    marginBottom: 8,
  },
  scriptText: {
    color: "#445547",
    fontSize: 12,
    lineHeight: 18,
  },
  submitRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sampleCount: {
    color: "#627266",
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: "#9bb0a0",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  submitBtnText: {
    color: "#f2f7f1",
    fontWeight: "700",
  },
  rightStack: {
    gap: 11,
  },
  sampleCard: {
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 14,
    backgroundColor: "#f7faf6",
    padding: 10,
  },
  sampleTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sampleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#263228",
  },
  sampleRequired: {
    color: "#758377",
    fontSize: 10,
    letterSpacing: 2,
  },
  sampleHint: {
    fontSize: 12,
    color: "#566859",
    marginTop: 4,
    marginBottom: 8,
  },
  sampleActionsWrap: {
    flexDirection: "row",
    gap: 8,
  },
  sampleActionCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#c8d1c8",
    borderRadius: 12,
    padding: 8,
    backgroundColor: "#f4f8f3",
  },
  sampleActionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2c3a2e",
  },
  sampleStatus: {
    alignSelf: "flex-start",
    fontSize: 10,
    color: "#6f7e72",
    borderWidth: 1,
    borderColor: "#c3cec5",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 5,
    marginBottom: 8,
  },
  recordBtn: {
    backgroundColor: "#3e6f49",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  recordBtnText: {
    color: "#f2f7f2",
    fontSize: 12,
    fontWeight: "700",
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: "#b7c5b9",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#f8fbf8",
  },
  uploadBtnText: {
    color: "#2e3a30",
    fontSize: 12,
    fontWeight: "600",
  },
  clearText: {
    marginTop: 8,
    textAlign: "right",
    fontSize: 11,
    color: "#66766a",
  },
  bottomNote: {
    fontSize: 12,
    color: "#66766a",
    marginTop: 4,
  },
});
