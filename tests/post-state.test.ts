import test from 'node:test';
import assert from 'node:assert/strict';
import { desiredPostState } from '../src/lib/post-state.ts';
import type { Post } from '../src/lib/models.ts';

const post: Post = { id: 'p', user_id: 'a', description: 'Hello', category: 'general', locality: 'Mansarovar', city: 'Jaipur', image_path: null, is_demo: false, created_at: '', sort_at: '', sort_id: 'p', author: { id: 'a', full_name: 'A neighbour', username: 'neighbour', avatar_path: null }, liked: false, saved: false, like_count: 2, comment_count: 0 };
test('desired-state likes are idempotent and do not mutate the source', () => {
  const liked = desiredPostState(post, 'liked', true);
  assert.equal(liked.like_count, 3);
  assert.equal(desiredPostState(liked, 'liked', true).like_count, 3);
  assert.equal(desiredPostState(liked, 'liked', false).like_count, 2);
  assert.equal(post.like_count, 2);
  assert.equal(desiredPostState(liked, 'saved', true).liked, true);
});
