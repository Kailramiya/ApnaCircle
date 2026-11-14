import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppText, styles } from './ui';
import { Avatar } from './avatar';
import { colors, radius, space } from '@/theme';
import { type Post, localityKeys } from '@/lib/models';
import { useI18n } from '@/store/preferences';
import { mediaUrl } from '@/services/media';

export const PostCard = memo(function PostCard({ post, detail = false }: { post: Post; detail?: boolean }) {
  const { t, date, number } = useI18n();
  const router = useRouter();
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
  </View>;
});
