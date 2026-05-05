import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { loginApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const { doctor, token } = await loginApi(email, password);
      login(doctor, token);
    } catch {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.logo}>🩺 MedVedev</Text>
        <Text style={styles.subtitle}>Clinical Consultation Intelligence</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textLight}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button title="Login" onPress={handleLogin} loading={loading} style={styles.btn} />
        <Button
          title="Don't have an account? Register"
          onPress={() => navigation.navigate('Register')}
          variant="secondary"
          style={styles.btn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, padding: 28, justifyContent: 'center' },
  logo: { fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
  },
  btn: { marginTop: 8 },
});
