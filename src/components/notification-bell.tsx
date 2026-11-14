import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AppText, IconButton } from './ui';
import { useAuth } from '@/providers';
import { useI18n } from '@/store/preferences';
import { getUnreadCount } from '@/services/notifications';
import { colors, radius } from '@/theme';

export function NotificationBell() {
  const { session } = useAuth();
  const { t, number } = useI18n();
  const router = useRouter();
  const query = useQuery({ queryKey: [session?.user.id, 'unread'], queryFn: ({ signal }) => getUnreadCount(signal), enabled: Boolean(session), refetchInterval: 60_000 });
  return <View><IconButton label={`${t('notifications')}${query.data ? ` · ${number(query.data)} ${t('unread')}` : ''}`} name={{ ios: 'bell', android: 'notifications_none' }} onPress={() => router.push('/notifications')} />
    {query.data ? <View pointerEvents="none" accessible={false} style={{ position: 'absolute', right: 0, top: 0, paddingHorizontal: 4, borderRadius: radius.pill, backgroundColor: colors.primary }}><AppText variant="small" style={{ color: colors.surface }}>{query.data > 99 ? '99+' : number(query.data)}</AppText></View> : null}</View>;
}
