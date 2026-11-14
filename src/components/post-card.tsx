import { memo } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppText, IconButton, Notice, styles } from './ui';
import { Avatar } from './avatar';
import { colors, radius, space } from '@/theme';
import { type Post, localityKeys } from '@/lib/models';
import { useI18n } from '@/store/preferences';
import { mediaUrl } from '@/services/media';
import { usePostAction } from '@/hooks/post-actions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assertCurrentAccount, captureAccount, isCurrentAccount } from '@/lib/account';
import { deletePost } from '@/services/posts';

export const PostCard = memo(function PostCard({ post, detail = false }: { post: Post; detail?: boolean }) {
  const { t, date, number } = useI18n();
  const router = useRouter();
  const account = captureAccount();
  const client = useQueryClient();
  const like = usePostAction(post, 'liked');
  const save = usePostAction(post, 'saved');
  const remove = useMutation({ mutationFn: () => { assertCurrentAccount(account); return deletePost(post.id); }, onSuccess: () => {
    if (!isCurrentAccount(account)) return;
    client.setQueryData([account.id, 'post', post.id], null);
    void client.invalidateQueries({ queryKey: [account.id, 'posts'] });
  } });
  return <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: 'continuous', padding: space.lg, gap: space.md }}>
    <View style={[styles.row, { flexWrap: 'nowrap', alignItems: 'flex-start' }]}><Avatar name={post.author.full_name} path={post.author.avatar_path} />
      <View style={{ flex: 1 }}><AppText variant="heading">{post.author.full_name}</AppText><AppText variant="small" style={{ color: colors.muted }}>{t(localityKeys[post.locality])} · {date(post.created_at)}</AppText></View>
    </View>
    <View style={styles.row}><AppText variant="label" style={{ color: colors.primaryDark }}>{t(post.category)}</AppText>{post.is_demo ? <AppText variant="small" style={{ color: colors.warmText }}>{t('demo')}</AppText> : null}</View>
    <Pressable disabled={detail} accessibilityRole={detail ? undefined : 'button'} accessibilityLabel={detail ? undefined : `${t('postDetail')}: ${post.description}`}
      onPress={() => router.push({ pathname: '/posts/[id]', params: { id: post.id } })} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, gap: space.md })}>
      <AppText numberOfLines={detail ? undefined : 6} selectable={detail}>{post.description}</AppText>
      {post.image_path ? <Image source={mediaUrl('post-images', post.image_path)} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.sm }} contentFit="cover" accessibilityLabel={t('photo')} /> : null}
    </Pressable>
    <View style={styles.divider} /><View style={styles.row}><AppText variant="small" style={{ color: colors.muted }}>{t('likes', { count: number(post.like_count) })}</AppText><AppText variant="small" style={{ color: colors.muted }}>{t('comments')} · {number(post.comment_count)}</AppText></View>
    <View style={styles.row}>
      <IconButton label={t(post.liked ? 'unlike' : 'like')} name={{ ios: post.liked ? 'heart.fill' : 'heart', android: post.liked ? 'favorite' : 'favorite_border' }} selected={post.liked} disabled={like.isPending} onPress={like.run} />
      {!detail ? <IconButton label={t('comment')} name={{ ios: 'bubble.left', android: 'chat_bubble_outline' }} onPress={() => router.push({ pathname: '/posts/[id]', params: { id: post.id } })} /> : null}
      <View style={{ flex: 1 }} /><IconButton label={t(post.saved ? 'unsavePost' : 'savePost')} name={{ ios: post.saved ? 'bookmark.fill' : 'bookmark', android: post.saved ? 'bookmark' : 'bookmark_border' }} selected={post.saved} disabled={save.isPending} onPress={save.run} />
      {post.user_id === account.id ? <IconButton label={t('deletePost')} name={{ ios: 'trash', android: 'delete' }} disabled={remove.isPending} onPress={() => Alert.alert(t('deletePost'), t('deletePostBody'), [{ text: t('cancel'), style: 'cancel' }, { text: t('delete'), style: 'destructive', onPress: () => remove.mutate() }])} /> : null}
    </View>{like.isError || save.isError || remove.isError ? <Notice error message={t('networkError')} /> : null}
  </View>;
});
