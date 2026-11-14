import { useMutation, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { assertCurrentAccount, captureAccount, isCurrentAccount } from '@/lib/account';
import { desiredPostState } from '@/lib/post-state';
import type { Post } from '@/lib/models';
import { setPostState } from '@/services/posts';

function patch(client: QueryClient, userId: string, postId: string, update: (post: Post) => Post) {
  client.setQueriesData<InfiniteData<Post[]>>({ queryKey: [userId, 'posts'] }, (old) => old ? { ...old, pages: old.pages.map((page) => page.map((post) => post.id === postId ? update(post) : post)) } : old);
  client.setQueryData<Post | null>([userId, 'post', postId], (old) => old ? update(old) : old);
}
export function usePostAction(post: Post, kind: 'liked' | 'saved') {
  const client = useQueryClient();
  const account = captureAccount();
  const key = [account.id, 'post-action', post.id, kind];
  const mutation = useMutation({
    mutationKey: key,
    mutationFn: (desired: boolean) => { assertCurrentAccount(account); return setPostState(post.id, kind, desired); },
    onMutate: async (desired) => {
      await Promise.all([client.cancelQueries({ queryKey: [account.id, 'posts'] }), client.cancelQueries({ queryKey: [account.id, 'post', post.id] })]);
      if (!isCurrentAccount(account)) return;
      patch(client, account.id, post.id, (current) => desiredPostState(current, kind, desired));
      return { previous: post[kind], count: post.like_count };
    },
    onError: (_error, _desired, context) => {
      if (!context || !isCurrentAccount(account)) return;
      // Roll back only this action's fields; concurrent saves/other posts survive.
      patch(client, account.id, post.id, (current) => kind === 'liked' ? { ...current, liked: context.previous, like_count: context.count } : { ...current, saved: context.previous });
    },
    onSettled: () => {
      if (!isCurrentAccount(account)) return;
      void client.invalidateQueries({ queryKey: [account.id, 'posts'] });
      void client.invalidateQueries({ queryKey: [account.id, 'post', post.id] });
    },
  });
  return { ...mutation, run: () => {
    if (client.isMutating({ mutationKey: key }) === 0) mutation.mutate(!post[kind]);
  } };
}
