import { Pressable, View } from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router/stack';
import { useRouter } from 'expo-router';
import { AppText, Icon, Notice, Screen, styles } from '@/components/ui';
import { PagedList } from '@/components/paged-list';
import { useI18n } from '@/store/preferences';
import { captureAccount, assertCurrentAccount, isCurrentAccount } from '@/lib/account';
import { nextCursor, type Cursor } from '@/lib/pagination';
import { getNotifications, markRead } from '@/services/notifications';
import type { Notification } from '@/lib/models';
import { colors, radius, space } from '@/theme';

function NotificationRow({ item }: { item: Notification }) {
  const { t, date } = useI18n();
  const account = captureAccount();
  const client = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({ mutationFn: () => { assertCurrentAccount(account); return markRead(item.id); }, onSuccess: () => {
    if (!isCurrentAccount(account)) return;
    void client.invalidateQueries({ queryKey: [account.id, 'notifications'] });
    void client.invalidateQueries({ queryKey: [account.id, 'unread'] });
    router.push({ pathname: '/posts/[id]', params: { id: item.post_id } });
  } });
  return <View style={{ gap: space.sm }}><Pressable accessibilityRole="button" accessibilityState={{ busy: mutation.isPending, disabled: mutation.isPending }} disabled={mutation.isPending} onPress={() => item.is_read ? router.push({ pathname: '/posts/[id]', params: { id: item.post_id } }) : mutation.mutate()}
    style={({ pressed }) => [styles.row, { padding: space.lg, borderRadius: radius.sm, backgroundColor: item.is_read ? colors.surface : colors.tint, opacity: pressed ? 0.6 : 1, flexWrap: 'nowrap', alignItems: 'flex-start' }]}>
    <Icon color={colors.primary} name={{ ios: item.type === 'like' ? 'heart.fill' : 'bubble.left.fill', android: item.type === 'like' ? 'favorite' : 'chat_bubble' }} />
    <View style={{ flex: 1 }}><AppText>{t(item.type === 'like' ? 'notificationLike' : 'notificationComment', { name: item.actor_name })}</AppText><AppText variant="small" style={{ color: colors.muted }}>{date(item.created_at)}</AppText>{!item.is_read ? <AppText variant="label" style={{ color: colors.primaryDark }}>{t('unread')}</AppText> : null}</View>
  </Pressable>{mutation.isError ? <Notice message={t('networkError')} error /> : null}</View>;
}
export default function NotificationsScreen() {
  const { t } = useI18n();
  const account = captureAccount();
  const query = useInfiniteQuery({ queryKey: [account.id, 'notifications'], queryFn: ({ pageParam, signal }) => getNotifications(pageParam, signal), initialPageParam: null as Cursor | null, getNextPageParam: nextCursor });
  return <Screen scroll={false}><Stack.Screen options={{ title: t('notifications') }} /><PagedList query={query} renderItem={(item) => <NotificationRow item={item} />} emptyTitle={t('noNotifications')} emptyBody={t('noNotificationsBody')} /></Screen>;
}
