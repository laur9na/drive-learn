import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/providers/AuthProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Drive Learn' }} />
        <Stack.Screen name="login" options={{ title: 'Sign In', headerShown: false }} />
        <Stack.Screen name="classes/index" options={{ title: 'My Classes' }} />
        <Stack.Screen name="classes/[id]" options={{ title: 'Class Details' }} />
        <Stack.Screen name="session/[classId]" options={{ title: 'Learning Session', headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
