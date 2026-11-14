import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from './avatar';
import { AppText, IconButton, Notice, styles } from './ui';
import type { Comment } from '@/lib/models';
import { useI18n } from '@/store/preferences';
import { captureAccount, isCurrentAccount } from '@/lib/account';
import { deleteComment } from '@/services/comments';
import { colors, space } from '@/theme';

export function CommentRow({ comment }: { comment: Comment }) {
  const { t, date } = useI18n();
  const account = captureAccount();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      await deleteComment(comment.id);
      if (!isCurrentAccount(account)) return;
      void client.invalidateQueries({ queryKey: [account.id, 'comments', comment.post_id] });
      void client.invalidateQueries({ queryKey: [account.id, 'post', comment.post_id] });
      void client.invalidateQueries({ queryKey: [account.id, 'posts'] });
    } catch { if (isCurrentAccount(account)) setFailed(true); }
    finally { if (isCurrentAccount(account)) setBusy(false); }
  }
  return <View style={{ gap: space.sm, paddingVertical: space.md }}><View style={[styles.row, { flexWrap: 'nowrap' }]}>
    <Avatar name={comment.author.full_name} path={comment.author.avatar_path} size={36} /><View style={{ flex: 1 }}><AppText variant="label">{comment.author.full_name}</AppText><AppText variant="small" style={{ color: colors.muted }}>{date(comment.created_at)}</AppText></View>
    {account.id === comment.user_id ? <IconButton label={t('delete')} disabled={busy} name={{ ios: 'trash', android: 'delete' }} onPress={() => Alert.alert(t('delete'), comment.content, [{ text: t('cancel'), style: 'cancel' }, { text: t('delete'), style: 'destructive', onPress: () => { void remove(); } }])} /> : null}
    </View><AppText selectable>{comment.content}</AppText>{failed ? <Notice message={t('networkError')} error /> : null}<View style={styles.divider} /></View>;
}
