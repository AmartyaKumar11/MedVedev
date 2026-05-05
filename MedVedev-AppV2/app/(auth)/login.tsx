import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { loginApi } from "../api/auth.api";

export default function LoginScreen() {
  const [doctorName, setDoctorName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLogin = async () => {
    if (!doctorName.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await loginApi(doctorName.trim(), password);
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      let msg =
        err?.response?.data?.detail ??
        err?.message ??
        "Login failed. Check your name and password.";
      if (typeof msg === "object") msg = JSON.stringify(msg);
      setError(String(msg));
    } finally {
      setLoading(false);
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
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}> 
            <Text style={styles.topLink}>Create account</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.cardWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.card}>
            <Text style={styles.kicker}>SIGN IN</Text>
            <Text style={styles.header}>Doctor Console</Text>
            <Text style={styles.helper}>Use your Doctor ID to access dashboard and sessions.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DOCTOR NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Same name as enrollment"
                placeholderTextColor="#6d7b71"
                value={doctorName}
                onChangeText={setDoctorName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6d7b71"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.signInBtn, (doctorName.trim() === "" || loading) && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={doctorName.trim() === "" || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#f0f6ef" />
                : <Text style={styles.signInText}>Sign In</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomHint} onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.bottomHintText}>New to MEDVEDEV V2? Create an account.</Text>
            </TouchableOpacity>
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
    paddingTop: 22,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#6e7b70",
    fontWeight: "600",
  },
  topLink: {
    fontSize: 16,
    color: "#1f2a21",
    fontWeight: "600",
  },
  cardWrap: {
    marginTop: 48,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 620,
    borderWidth: 1,
    borderColor: "#c5d0c7",
    borderRadius: 16,
    backgroundColor: "#f7faf6",
    padding: 20,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#768378",
    marginBottom: 8,
  },
  header: {
    fontSize: 46,
    fontWeight: "800",
    marginBottom: 8,
    color: "#202c22",
  },
  helper: {
    fontSize: 23,
    color: "#516152",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
    gap: 7,
  },
  label: {
    fontSize: 12,
    letterSpacing: 3,
    color: "#748176",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#b8c5ba",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    fontSize: 16,
    color: "#213025",
    backgroundColor: "#f4f8f3",
  },
  signInBtn: {
    borderRadius: 16,
    backgroundColor: "#97ab9b",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  signInBtnDisabled: {
    opacity: 0.7,
  },
  signInText: {
    color: "#f0f6ef",
    fontSize: 17,
    fontWeight: "700",
  },
  errorText: {
    color: "#c0392b",
    fontSize: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0b0aa",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fdf0ef",
  },
  bottomHint: {
    marginTop: 14,
  },
  bottomHintText: {
    fontSize: 14,
    color: "#576658",
  },
});
