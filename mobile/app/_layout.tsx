import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/providers/AuthProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#6366f1' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="classes/index" options={{ title: 'My Classes' }} />
        <Stack.Screen name="classes/[id]" options={{ title: 'Class' }} />
      </Stack>
    </AuthProvider>
  );
}
