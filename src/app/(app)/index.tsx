import { useState } from 'react';
import { Stack } from 'expo-router/stack';
import { AppText, Button, Notice, Screen } from '@/components/ui';
import { useAuth } from '@/providers';
import { useI18n } from '@/store/preferences';
import { signOut } from '@/services/auth';

export default function Community() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [failed, setFailed] = useState(false);
  return <Screen><Stack.Screen options={{ title: t('appName') }} /><AppText variant="title">{profile?.full_name}</AppText>
    <AppText>{t('foundationBody')}</AppText>{failed ? <Notice message={t('networkError')} error /> : null}
    <Button title={t('signOut')} variant="secondary" onPress={() => { void signOut().catch(() => setFailed(true)); }} />
  </Screen>;
}
