import type { Post } from './models.ts';

export function desiredPostState(post: Post, kind: 'liked' | 'saved', desired: boolean): Post {
  if (kind === 'saved') return { ...post, saved: desired };
  return { ...post, liked: desired, like_count: Math.max(0, post.like_count + (desired === post.liked ? 0 : desired ? 1 : -1)) };
}
