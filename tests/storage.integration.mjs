// Explicit opt-in integration check. Uses two real test accounts in a disposable
// development project and the Storage API; never edits storage metadata via SQL.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const required = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'APNACIRCLE_TEST_A_EMAIL', 'APNACIRCLE_TEST_A_PASSWORD', 'APNACIRCLE_TEST_B_EMAIL', 'APNACIRCLE_TEST_B_PASSWORD', 'APNACIRCLE_TEST_JPEG'];
for (const key of required) assert.ok(process.env[key], `Missing ${key}`);
const bytes = await readFile(process.env.APNACIRCLE_TEST_JPEG);
assert.ok(bytes.length <= 10 * 1024 * 1024 && bytes[0] === 0xff && bytes[1] === 0xd8, 'Use a real JPEG smaller than 10 MB');
const options = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.any([AbortSignal.timeout(20_000), ...(init?.signal ? [init.signal] : [])]) }) } };
const a = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const b = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const loginA = await a.auth.signInWithPassword({ email: process.env.APNACIRCLE_TEST_A_EMAIL, password: process.env.APNACIRCLE_TEST_A_PASSWORD });
const loginB = await b.auth.signInWithPassword({ email: process.env.APNACIRCLE_TEST_B_EMAIL, password: process.env.APNACIRCLE_TEST_B_PASSWORD });
assert.equal(loginA.error, null, 'Account A login failed');
assert.equal(loginB.error, null, 'Account B login failed');
const aId = loginA.data.user.id;
const bId = loginB.data.user.id;
assert.notEqual(aId, bId, 'Use two different test accounts');
const profile = await a.from('profiles').select('locality').eq('id', aId).single();
assert.equal(profile.error, null, 'Finish onboarding for account A first');
const postId = randomUUID();
const pathA = `${aId}/${postId}/image.jpg`;
const pathB = `${bId}/${randomUUID()}/image.jpg`;
try {
  const forbidden = await a.storage.from('post-images').upload(pathB, bytes, { contentType: 'image/jpeg' });
  assert.ok(forbidden.error, 'A uploaded into B storage path');
  const upload = await a.storage.from('post-images').upload(pathA, bytes, { contentType: 'image/jpeg' });
  assert.equal(upload.error, null, 'Owner upload failed');
  const overwrite = await a.storage.from('post-images').upload(pathA, bytes, { contentType: 'image/jpeg', upsert: true });
  assert.ok(overwrite.error, 'Immutable image was overwritten');
  await b.storage.from('post-images').remove([pathA]);
  assert.equal((await a.storage.from('post-images').exists(pathA)).data, true, 'B removed A image');
  const insert = await a.from('posts').insert({ id: postId, user_id: aId, description: 'Temporary storage-policy check', category: 'general', locality: profile.data.locality, image_path: pathA });
  assert.equal(insert.error, null, 'Temporary owner post failed');
  await a.storage.from('post-images').remove([pathA]);
  assert.equal((await a.storage.from('post-images').exists(pathA)).data, true, 'Referenced image was removed');
  const deletion = await a.from('posts').delete().eq('id', postId).eq('user_id', aId);
  assert.equal(deletion.error, null);
  const cleanup = await a.storage.from('post-images').remove([pathA]);
  assert.equal(cleanup.error, null, 'Confirmed unused owner image cleanup failed');
  assert.ok(cleanup.data.some((object) => object.name === pathA), 'Unused image was not deleted');
  console.info('Storage ownership, immutability and referenced-image checks passed.');
} finally {
  const cleanupPost = await a.from('posts').delete().eq('id', postId).eq('user_id', aId);
  const cleanup = await Promise.allSettled([a.storage.from('post-images').remove([pathA]), b.storage.from('post-images').remove([pathB])]);
  if (cleanupPost.error || cleanup.some((result) => result.status === 'rejected' || result.value.error)) {
    throw new Error(`Test cleanup needs review: post ${postId}; objects ${pathA}, ${pathB}`);
  }
}
