import { Stack } from 'expo-router/stack';
import { Screen } from '@/components/ui';
import { PagedList } from '@/components/paged-list';
import { PostCard } from '@/components/post-card';
import { usePosts } from '@/hooks/posts';
import { useI18n } from '@/store/preferences';

export default function SavedScreen() {
  const { t } = useI18n();
  const query = usePosts({ saved: true });
  return <Screen scroll={false}><Stack.Screen options={{ title: t('saved') }} /><PagedList query={query} renderItem={(post) => <PostCard post={post} />} emptyTitle={t('noSaved')} emptyBody={t('noSavedBody')} /></Screen>;
}
