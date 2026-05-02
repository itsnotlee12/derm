import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { Platform, StatusBar as RNStatusBar, View } from 'react-native';
import { getCurrentUserEmail } from '@/lib/store';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const email = await getCurrentUserEmail();
      const inAuth = segments[0] === '(auth)';
      if (email && inAuth) {
        router.replace('/(app)');
      } else if (!email && !inAuth) {
        router.replace('/(auth)/login');
      }
      setReady(true);
    })();
  }, []);

  return (
    <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0 }}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </View>
  );
}
