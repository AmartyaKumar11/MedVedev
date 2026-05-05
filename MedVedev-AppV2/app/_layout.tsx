import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useEffect, useState } from 'react';
import { loadToken } from './api/tokenStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadToken().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
