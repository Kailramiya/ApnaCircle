import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { randomUUID } from 'expo-crypto';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { AppText, Button, EmptyState, Field, Loading, Notice, Screen, styles } from '@/components/ui';
import { PagedList } from '@/components/paged-list';
import { CommentRow } from '@/components/comment-row';
import { PostCard } from '@/components/post-card';
import { usePost } from '@/hooks/posts';
import { useI18n } from '@/store/preferences';
import { addComment, getComments } from '@/services/comments';
import { commentInput } from '@/lib/models';
import { captureAccount, isCurrentAccount } from '@/lib/account';
import { nextCursor, type Cursor } from '@/lib/pagination';
import type { MessageKey } from '@/lib/translations';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const query = usePost(id);
  const client = useQueryClient();
  const account = captureAccount();
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<MessageKey>();
  const pending = useRef<{ id: string; content: string } | null>(null);
  const inFlight = useRef(false);
  const comments = useInfiniteQuery({ queryKey: [account.id, 'comments', id], queryFn: ({ pageParam, signal }) => getComments(id, pageParam, signal), initialPageParam: null as Cursor | null, getNextPageParam: nextCursor, enabled: Boolean(query.data) });
  async function send() {
    if (inFlight.current) return;
    const parsed = commentInput.safeParse(content);
    if (!parsed.success) { setError('invalidComment'); return; }
    pending.current ??= { id: randomUUID(), content: parsed.data };
    inFlight.current = true;
    setLocked(true); setBusy(true); setError(undefined);
    try {
      await addComment(pending.current.id, id, pending.current.content);
      if (!isCurrentAccount(account)) return;
      pending.current = null; setLocked(false); setContent('');
      void client.invalidateQueries({ queryKey: [account.id, 'comments', id] });
      void client.invalidateQueries({ queryKey: [account.id, 'post', id] });
      void client.invalidateQueries({ queryKey: [account.id, 'posts'] });
    } catch { if (isCurrentAccount(account)) setError('commentUncertain'); }
    finally { inFlight.current = false; if (isCurrentAccount(account)) setBusy(false); }
  }
  const header = query.data ? <View style={styles.section}><PostCard post={query.data} detail />
    <AppText variant="heading">{t('comments')}</AppText><Field label={t('comment')} placeholder={t('commentHint')} value={content} onChangeText={setContent} multiline maxLength={500} editable={!locked} />
    {error ? <Notice error message={t(error)} /> : null}<Button title={t(locked ? 'retry' : 'send')} loading={busy} onPress={() => { void send(); }} />
  </View> : undefined;
  return <Screen scroll={false}><Stack.Screen options={{ title: t('postDetail') }} />{query.isPending ? <Loading /> : query.data ? <PagedList query={comments} renderItem={(comment) => <CommentRow comment={comment} />} header={header} emptyTitle={t('noComments')} /> : query.isError ? <Notice error message={t('networkError')} onRetry={() => { void query.refetch(); }} /> : <EmptyState title={t('unavailable')} />}</Screen>;
}
