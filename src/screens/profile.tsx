import { useState } from 'react';
import { Stack } from 'expo-router/stack';
import { AppText, Button, Notice, Screen } from '@/components/ui';
import { Avatar } from '@/components/avatar';
import { useAuth } from '@/providers';
import { useI18n } from '@/store/preferences';
import { signOut } from '@/services/auth';
import { localityKeys } from '@/lib/models';

export default function ProfileScreen() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [failed, setFailed] = useState(false);
  if (!profile) return null;
  return <Screen><Stack.Screen options={{ title: t('profile') }} /><Avatar name={profile.full_name} path={profile.avatar_path} size={80} /><AppText variant="title">{profile.full_name}</AppText>
    <AppText>@{profile.username} · {t(localityKeys[profile.locality])}</AppText><AppText>{profile.bio}</AppText>
    {failed ? <Notice message={t('networkError')} error /> : null}
    <Button title={t('signOut')} variant="secondary" onPress={() => { void signOut().catch(() => setFailed(true)); }} />
  </Screen>;
}
