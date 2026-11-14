import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { notificationSchema } from '@/lib/models';
import { PAGE_SIZE, type Cursor } from '@/lib/pagination';
import { assertCurrentAccount, captureAccount } from '@/lib/account';

export async function getNotifications(cursor: Cursor | null, signal: AbortSignal) {
  const { data, error } = await supabase.rpc('list_notifications', { p_cursor_time: cursor?.time ?? null, p_cursor_id: cursor?.id ?? null, p_limit: PAGE_SIZE }).abortSignal(signal);
  if (error) throw error;
  return z.array(notificationSchema).parse(data);
}
export async function getUnreadCount(signal: AbortSignal) {
  const account = captureAccount();
  const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', account.id).eq('is_read', false).abortSignal(signal);
  assertCurrentAccount(account);
  if (error) throw error;
  return count ?? 0;
}
export async function markRead(id: string) {
  z.uuid().parse(id);
  const account = captureAccount();
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('recipient_id', account.id);
  assertCurrentAccount(account);
  if (error) throw error;
}
