import { Stack } from 'expo-router/stack';
import { colors } from '@/theme';

export default function TabStack() {
  return <Stack screenOptions={{ headerTintColor: colors.text, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }} />;
}
