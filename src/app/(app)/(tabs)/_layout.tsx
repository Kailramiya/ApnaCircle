import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useI18n } from '@/store/preferences';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { t } = useI18n();
  return <NativeTabs tintColor={colors.primary}>
    <NativeTabs.Trigger name="home"><NativeTabs.Trigger.Label>{t('home')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="house.fill" md="home" /></NativeTabs.Trigger>
    <NativeTabs.Trigger name="profile"><NativeTabs.Trigger.Label>{t('profile')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" /></NativeTabs.Trigger>
  </NativeTabs>;
}
