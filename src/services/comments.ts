import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { commentInput, commentSchema } from '@/lib/models';
import { PAGE_SIZE, type Cursor } from '@/lib/pagination';
import { assertCurrentAccount, captureAccount } from '@/lib/account';
import { publishOnce } from '@/lib/publish';

export async function getComments(postId: string, cursor: Cursor | null, signal: AbortSignal) {
  z.uuid().parse(postId);
  const { data, error } = await supabase.rpc('list_comments', { p_post_id: postId, p_cursor_time: cursor?.time ?? null, p_cursor_id: cursor?.id ?? null, p_limit: PAGE_SIZE }).abortSignal(signal);
  if (error) throw error;
  return z.array(commentSchema).parse(data);
}
export async function addComment(id: string, postId: string, content: string) {
  z.uuid().parse(id); z.uuid().parse(postId);
  const text = commentInput.parse(content);
  const account = captureAccount();
  return publishOnce({
    find: async () => {
      assertCurrentAccount(account);
      const { data, error } = await supabase.from('comments').select('id').eq('id', id).eq('user_id', account.id).maybeSingle();
      assertCurrentAccount(account);
      if (error) throw error;
      return data ? z.object({ id: z.uuid() }).parse(data) : null;
    },
    upload: async () => undefined,
    insert: async () => {
      assertCurrentAccount(account);
      const { data, error } = await supabase.from('comments').insert({ id, post_id: postId, user_id: account.id, content: text }).select('id').single();
      assertCurrentAccount(account);
      if (error) throw error;
      return z.object({ id: z.uuid() }).parse(data);
    },
  });
}
export async function deleteComment(id: string) {
  z.uuid().parse(id);
  const account = captureAccount();
  const { error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', account.id);
  assertCurrentAccount(account);
  if (error) throw error;
}
