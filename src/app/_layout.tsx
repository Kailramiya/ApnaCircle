import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import type { ErrorBoundaryProps } from 'expo-router';
import { Providers, useAuth } from '@/providers';
import { colors } from '@/theme';
import { Button, EmptyState, Loading, Notice, Screen } from '@/components/ui';
import { useI18n } from '@/store/preferences';
import { isConfigured } from '@/lib/supabase';

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { t } = useI18n();
  return <Screen><EmptyState title={t('errorTitle')} body={t('networkError')}><Button title={t('retry')} onPress={() => { void retry(); }} /></EmptyState></Screen>;
}
function Navigation() {
  const { t } = useI18n();
  const auth = useAuth();
  if (!auth.ready || auth.profilePending) return <Screen><Loading /></Screen>;
  if (auth.error || (auth.profileError && !auth.profile)) return <Screen><Notice message={t('networkError')} error onRetry={auth.profileError ? auth.retryProfile : auth.retrySession} /></Screen>;
  return <Stack key={auth.session?.user.id ?? 'guest'} screenOptions={{ headerTintColor: colors.text, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="auth/callback" options={{ title: t('appName') }} />
    <Stack.Protected guard={!auth.session}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={Boolean(auth.session) && auth.recovery}><Stack.Screen name="reset-password" /></Stack.Protected>
    <Stack.Protected guard={Boolean(auth.session) && !auth.recovery && !auth.profile}><Stack.Screen name="onboarding" /></Stack.Protected>
    <Stack.Protected guard={Boolean(auth.session) && !auth.recovery && Boolean(auth.profile)}><Stack.Screen name="(app)" options={{ headerShown: false }} /></Stack.Protected>
  </Stack>;
}
export default function RootLayout() {
  const { t } = useI18n();
  if (!isConfigured) return <Screen><EmptyState title={t('setupTitle')} body={t('setupBody')} /></Screen>;
  return <Providers><StatusBar style="dark" /><Navigation /></Providers>;
}
