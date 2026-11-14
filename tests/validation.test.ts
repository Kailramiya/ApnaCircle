import test from 'node:test';
import assert from 'node:assert/strict';
import { commentInput, credentialsSchema, postInput, profileInput } from '../src/lib/models.ts';

test('forms reject whitespace, invalid ownership-independent fields and oversized input', () => {
  assert.equal(postInput.safeParse({ description: '   ', category: 'general', locality: 'Mansarovar' }).success, false);
  assert.equal(postInput.safeParse({ description: 'Hello', category: 'unknown', locality: 'Mansarovar' }).success, false);
  assert.equal(commentInput.safeParse('x'.repeat(501)).success, false);
  assert.equal(credentialsSchema.safeParse({ email: 'not-an-email', password: 'strongpassword' }).success, false);
  assert.equal(profileInput.safeParse({ full_name: 'Aman', username: 'Bad Name!', bio: '', locality: 'Mansarovar', preferred_language: 'en' }).success, false);
  assert.deepEqual(postInput.parse({ description: '  नमस्ते पड़ोसियों  ', category: 'general', locality: 'Mansarovar' }), { description: 'नमस्ते पड़ोसियों', category: 'general', locality: 'Mansarovar' });
});
