import { useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router/stack';
import { Chips, Screen, styles } from '@/components/ui';
import { PagedList } from '@/components/paged-list';
import { PostCard } from '@/components/post-card';
import { usePosts } from '@/hooks/posts';
import { useI18n } from '@/store/preferences';
import { useJobs } from '@/hooks/jobs';
import { JobCard } from '@/components/job-card';

function SavedPosts() {
  const { t } = useI18n();
  const query = usePosts({ saved: true });
  return <PagedList query={query} renderItem={(post) => <PostCard post={post} />} emptyTitle={t('noSaved')} emptyBody={t('noSavedBody')} />;
}
function SavedJobs() {
  const { t } = useI18n();
  const query = useJobs({ saved: true });
  return <PagedList query={query} renderItem={(job) => <JobCard job={job} />} emptyTitle={t('noSaved')} emptyBody={t('noSavedBody')} />;
}
export default function SavedScreen() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'posts' | 'jobs'>('posts');
  return <Screen scroll={false}><Stack.Screen options={{ title: t('saved') }} /><View style={[styles.content, { flexGrow: 0 }]}><Chips value={tab} onChange={setTab} options={[{ value: 'posts', label: t('savedPosts') }, { value: 'jobs', label: t('savedJobs') }]} /></View>{tab === 'posts' ? <SavedPosts /> : <SavedJobs />}</Screen>;
}
