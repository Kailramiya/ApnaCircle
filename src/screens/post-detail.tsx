import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { EmptyState, Loading, Notice, Screen } from '@/components/ui';
import { PostCard } from '@/components/post-card';
import { usePost } from '@/hooks/posts';
import { useI18n } from '@/store/preferences';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const query = usePost(id);
  return <Screen><Stack.Screen options={{ title: t('postDetail') }} />{query.isPending ? <Loading /> : query.data ? <PostCard post={query.data} detail /> : query.isError ? <Notice error message={t('networkError')} onRetry={() => { void query.refetch(); }} /> : <EmptyState title={t('unavailable')} />}</Screen>;
}
