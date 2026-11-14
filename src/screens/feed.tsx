import { useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router/stack';
import { AppText, Button, Chips, Field, Notice, Screen, styles } from '@/components/ui';
import { PagedList } from '@/components/paged-list';
import { PostCard } from '@/components/post-card';
import { usePosts } from '@/hooks/posts';
import { useI18n } from '@/store/preferences';
import { categories, localities, localityKeys, type Post } from '@/lib/models';
import { useAuth } from '@/providers';
import { colors } from '@/theme';

export default function FeedScreen() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Post['category'] | ''>('');
  const [locality, setLocality] = useState<Post['locality'] | ''>('');
  const query = usePosts({ search, category: category || undefined, locality: locality || undefined });
  const header = <View style={styles.section}>
    <AppText variant="label" style={{ color: colors.primaryDark }}>{t('jaipur')} · {profile ? t(localityKeys[profile.locality]) : ''}</AppText>
    <AppText variant="title">{t('aroundYou')}</AppText><AppText style={{ color: colors.muted }}>{t('feedIntro')}</AppText>
    <Field label={t('search')} placeholder={t('searchPosts')} value={searchText} maxLength={100} onChangeText={(value) => { setSearchText(value); if (!value) setSearch(''); }} onSubmitEditing={() => setSearch(searchText.trim())} returnKeyType="search" />
    <Button title={t('search')} onPress={() => setSearch(searchText.trim())} variant="secondary" />
    <Chips value={category} onChange={setCategory} options={[{ value: '', label: t('all') }, ...categories.map((value) => ({ value, label: t(value) }))]} />
    <Chips value={locality} onChange={setLocality} options={[{ value: '', label: t('allLocalities') }, ...localities.map((value) => ({ value, label: t(localityKeys[value]) }))]} />
    <Notice message={t('demoNotice')} />
  </View>;
  return <Screen scroll={false}><Stack.Screen options={{ title: t('appName') }} /><PagedList query={query} renderItem={(post) => <PostCard post={post} />} header={header} emptyTitle={t(search || category || locality ? 'noMatches' : 'noPosts')} emptyBody={t(search || category || locality ? 'noMatchesBody' : 'noPostsBody')} /></Screen>;
}
