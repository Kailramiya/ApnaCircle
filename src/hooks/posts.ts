import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers';
import { nextCursor, type Cursor } from '@/lib/pagination';
import { getPosts, type PostFilters } from '@/services/posts';

export function usePosts(filters: PostFilters) {
  const { session } = useAuth();
  return useInfiniteQuery({
    queryKey: [session?.user.id, 'posts', filters],
    queryFn: ({ pageParam, signal }) => getPosts(filters, pageParam, signal),
    initialPageParam: null as Cursor | null, getNextPageParam: nextCursor, enabled: Boolean(session),
  });
}
export function usePost(id: string) {
  const { session } = useAuth();
  return useQuery({ queryKey: [session?.user.id, 'post', id], queryFn: async ({ signal }) => (await getPosts({ postId: id }, null, signal))[0] ?? null, enabled: Boolean(session) });
}
