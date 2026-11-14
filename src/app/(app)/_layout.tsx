import { Stack } from 'expo-router/stack';
import { colors } from '@/theme';
import { useAuth } from '@/providers';

export default function AppLayout() {
  const { session } = useAuth();
  return <Stack key={session?.user.id} screenOptions={{ headerTintColor: colors.text, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /></Stack>;
}
