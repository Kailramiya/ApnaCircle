import { Redirect } from 'expo-router';
import { useAuth } from '@/providers';
import { useI18n } from '@/store/preferences';
import { Loading, Notice, Screen } from '@/components/ui';

export default function Index() {
  const { session, profile, recovery, ready, error, profilePending, profileError, retryProfile, retrySession } = useAuth();
  const { t } = useI18n();
  if (!ready || (profilePending && !recovery)) return <Screen><Loading /></Screen>;
  if (error || (profileError && !profile && !recovery)) return <Screen><Notice message={t('networkError')} error onRetry={profileError ? retryProfile : retrySession} /></Screen>;
  return <Redirect href={!session ? '/login' : recovery ? '/reset-password' : !profile ? '/onboarding' : '/(app)/(tabs)/home'} />;
}
