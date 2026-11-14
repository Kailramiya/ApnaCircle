import { useState } from 'react';
import { Stack } from 'expo-router/stack';
import { useQueryClient } from '@tanstack/react-query';
import { AppText, Button, Chips, Notice, Screen } from '@/components/ui';
import { useAuth } from '@/providers';
import { useI18n, usePreferences } from '@/store/preferences';
import { localities, localityKeys } from '@/lib/models';
import { savePreferences } from '@/services/profile';
import { captureAccount, isCurrentAccount } from '@/lib/account';
import type { Language } from '@/lib/translations';

export default function SettingsScreen() {
  const { profile } = useAuth();
  const { t, language: activeLanguage } = useI18n();
  const client = useQueryClient();
  const [language, setLanguage] = useState<Language>(activeLanguage);
  const [locality, setLocality] = useState<(typeof localities)[number]>(profile?.locality ?? 'Mansarovar');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'error' | 'saved'>();
  async function save() {
    const account = captureAccount();
    setBusy(true); setStatus(undefined);
    try {
      const next = await savePreferences(locality, language);
      if (!isCurrentAccount(account)) return;
      client.setQueryData([account.id, 'profile'], next); usePreferences.getState().setLanguage(next.preferred_language); setStatus('saved');
    } catch { if (isCurrentAccount(account)) setStatus('error'); }
    finally { if (isCurrentAccount(account)) setBusy(false); }
  }
  return <Screen><Stack.Screen options={{ title: t('settings') }} /><AppText>{t('settingsBody')}</AppText>
    <AppText variant="heading">{t('language')}</AppText><Chips disabled={busy} value={language} onChange={setLanguage} options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }]} />
    <AppText variant="heading">{t('locality')}</AppText><Chips disabled={busy} value={locality} onChange={setLocality} options={localities.map((value) => ({ value, label: t(localityKeys[value]) }))} />
    {status ? <Notice error={status === 'error'} message={t(status === 'error' ? 'networkError' : 'profileSaved')} /> : null}
    <Button title={t('saveChanges')} loading={busy} onPress={() => { void save(); }} /><AppText variant="small">{t('profilePrivacy')}</AppText>
  </Screen>;
}
