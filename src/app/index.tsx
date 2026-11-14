import { Stack } from 'expo-router/stack';
import { AppText, Screen, Chips, EmptyState } from '@/components/ui';
import { useI18n, usePreferences } from '@/store/preferences';

export default function Welcome() {
  const { t, language } = useI18n();
  const setLanguage = usePreferences((s) => s.setLanguage);
  return <Screen><Stack.Screen options={{ title: t('appName') }} />
    <AppText variant="hero">{t('welcome')}</AppText><AppText>{t('welcomeBody')}</AppText>
    <Chips value={language} onChange={setLanguage} options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }]} />
    <EmptyState title={t('foundation')} body={t('foundationBody')} />
  </Screen>;
}
