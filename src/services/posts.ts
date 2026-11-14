import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { postSchema, type Post } from '@/lib/models';
import { PAGE_SIZE, type Cursor } from '@/lib/pagination';

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
