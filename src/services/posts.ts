import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { postInput, postSchema, type Post, type PostInput } from '@/lib/models';
import { PAGE_SIZE, type Cursor } from '@/lib/pagination';
import { assertCurrentAccount, captureAccount } from '@/lib/account';
import { publishOnce } from '@/lib/publish';
import { uploadPhoto, type PreparedPhoto } from './media';

export type PostFilters = { search?: string; category?: Post['category']; locality?: Post['locality']; author?: string; saved?: boolean; postId?: string };
export async function getPosts(filters: PostFilters, cursor: Cursor | null, signal: AbortSignal) {
  if (filters.postId) z.uuid().parse(filters.postId);
  const { data, error } = await supabase.rpc('list_posts', {
    p_search: filters.search?.trim().slice(0, 100) ?? '', p_category: filters.category ?? null,
    p_locality: filters.locality ?? null, p_author: filters.author ?? null, p_saved: filters.saved ?? false,
    p_post_id: filters.postId ?? null, p_cursor_time: cursor?.time ?? null, p_cursor_id: cursor?.id ?? null, p_limit: PAGE_SIZE,
  }).abortSignal(signal);
  if (error) throw error;
  return z.array(postSchema).parse(data);
}

export type PostSubmission = { id: string; ownerId: string; values: PostInput; photo: PreparedPhoto | null };
export async function createPost(submission: PostSubmission) {
  const account = captureAccount();
  if (account.id !== submission.ownerId) throw new Error('Submission belongs to another account');
  const id = z.uuid().parse(submission.id);
  const values = postInput.parse(submission.values);
  const imagePath = submission.photo ? `${account.id}/${id}/image.jpg` : null;
  const result = await publishOnce({
    find: async () => {
      assertCurrentAccount(account);
      const { data, error } = await supabase.from('posts').select('id').eq('id', id).eq('user_id', account.id).maybeSingle();
      assertCurrentAccount(account);
      if (error) throw error;
      return data ? z.object({ id: z.uuid() }).parse(data) : null;
    },
    upload: async () => {
      assertCurrentAccount(account);
      if (submission.photo && imagePath) await uploadPhoto('post-images', imagePath, submission.photo);
      assertCurrentAccount(account);
    },
    insert: async () => {
      assertCurrentAccount(account);
      const { data, error } = await supabase.from('posts').insert({ id, user_id: account.id, ...values, image_path: imagePath }).select('id').single();
      assertCurrentAccount(account);
      if (error) throw error;
      return z.object({ id: z.uuid() }).parse(data);
    },
  });
  assertCurrentAccount(account);
  return result;
}

export async function setPostState(postId: string, kind: 'liked' | 'saved', desired: boolean) {
  z.uuid().parse(postId); z.boolean().parse(desired);
  const account = captureAccount();
  const table = kind === 'liked' ? 'likes' : 'saved_posts';
  const request = desired
    ? supabase.from(table).upsert({ post_id: postId, user_id: account.id }, { onConflict: 'post_id,user_id', ignoreDuplicates: true })
    : supabase.from(table).delete().eq('post_id', postId).eq('user_id', account.id);
  const { error } = await request;
  assertCurrentAccount(account);
  if (error) throw error;
}
export async function deletePost(postId: string) {
  z.uuid().parse(postId);
  const account = captureAccount();
  const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', account.id);
  assertCurrentAccount(account);
  if (error) throw error;
  // Media remains available for reviewed orphan maintenance, never race-prone cleanup.
}
