import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Stack } from 'expo-router/stack';
import { useRouter } from 'expo-router';
import { AppText, Button, Notice, Screen, styles } from '@/components/ui';
import { Avatar } from '@/components/avatar';
import { PagedList } from '@/components/paged-list';
import { PostCard } from '@/components/post-card';
import { usePosts } from '@/hooks/posts';
import { useAuth } from '@/providers';
import { useI18n } from '@/store/preferences';
import { signOut } from '@/services/auth';
import { localityKeys } from '@/lib/models';

export default function ProfileScreen() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const posts = usePosts({ author: profile?.id });
  if (!profile) return null;
  const header = <View style={styles.section}><Avatar name={profile.full_name} path={profile.avatar_path} size={80} /><AppText variant="title">{profile.full_name}</AppText>
    <AppText>@{profile.username} · {t(localityKeys[profile.locality])}</AppText><AppText>{profile.bio}</AppText>
    {failed ? <Notice message={t('networkError')} error /> : null}
    <Button title={t('editProfile')} onPress={() => router.push('/profile/edit')} />
    <Button title={t('applications')} variant="secondary" onPress={() => router.push('/applications')} />
    <Button title={t('saved')} variant="secondary" onPress={() => router.navigate('/(app)/(tabs)/saved')} />
    <Button title={t('settings')} variant="secondary" onPress={() => router.push('/settings')} />
    <Button title={t('signOut')} variant="ghost" loading={busy} onPress={() => Alert.alert(t('signOutTitle'), t('signOutBody'), [{ text: t('cancel'), style: 'cancel' }, { text: t('signOut'), style: 'destructive', onPress: () => { setBusy(true); void signOut().catch(() => { setFailed(true); setBusy(false); }); } }])} />
    <AppText variant="heading">{t('myPosts')}</AppText></View>;
  return <Screen scroll={false}><Stack.Screen options={{ title: t('profile') }} /><PagedList query={posts} renderItem={(post) => <PostCard post={post} />} header={header} emptyTitle={t('noPosts')} emptyBody={t('noPostsBody')} /></Screen>;
}
