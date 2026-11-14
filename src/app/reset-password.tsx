import { useState } from 'react';
import { Stack } from 'expo-router/stack';
import { Button, Field, Notice, Screen } from '@/components/ui';
import { useI18n } from '@/store/preferences';
import { useAuth } from '@/providers';
import { updatePassword } from '@/services/auth';
import { credentialsSchema } from '@/lib/models';
import { authErrorKey } from '@/lib/errors';
import type { MessageKey } from '@/lib/translations';

export default function ResetPassword() {
  const { t } = useI18n();
  const { setRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey>();
  async function submit() {
    if (!credentialsSchema.shape.password.safeParse(password).success) { setError('invalidPassword'); return; }
    setBusy(true);
    try { await updatePassword(password); setRecovery(false); }
    catch (error) { setError(authErrorKey(error, 'networkError')); }
    finally { setBusy(false); }
  }
  return <Screen><Stack.Screen options={{ title: t('resetPassword'), headerBackVisible: false }} />
    <Field label={t('password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
    {error ? <Notice message={t(error)} error /> : null}<Button title={t('saveChanges')} loading={busy} onPress={() => { void submit(); }} />
  </Screen>;
}
