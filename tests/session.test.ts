import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionStorage } from '../src/lib/secure-session.ts';
import { captureAccount, isCurrentAccount, switchAccount } from '../src/lib/account.ts';

test('encrypted session adapter preserves Unicode, serial writes and deletion', async () => {
  const entries = new Map<string, string>();
  let version = 0;
  const storage = createSessionStorage({
    get: async (key) => entries.get(key) ?? null,
    set: async (key, value) => { assert.ok(Buffer.byteLength(value) <= 2000); entries.set(key, value); },
    remove: async (key) => { entries.delete(key); },
  }, () => `revision-${++version}`);
  const token = 'नमस्ते🙂'.repeat(700);
  await storage.setItem('auth', token);
  assert.equal(await storage.getItem('auth'), token);
  await Promise.all([storage.setItem('auth', 'first'), storage.setItem('auth', 'second')]);
  assert.equal(await storage.getItem('auth'), 'second');
  await storage.removeItem('auth');
  assert.equal(await storage.getItem('auth'), null);
  assert.equal(entries.size, 0);
});

test('failed chunk write leaves the previous session readable', async () => {
  const entries = new Map<string, string>();
  let version = 0;
  let fail = false;
  const storage = createSessionStorage({
    get: async (key) => entries.get(key) ?? null,
    set: async (key, value) => { if (fail && key.endsWith('.1')) throw new Error('Storage full'); entries.set(key, value); },
    remove: async (key) => { entries.delete(key); },
  }, () => `revision-${++version}`);
  await storage.setItem('auth', 'existing session');
  fail = true;
  await assert.rejects(storage.setItem('auth', 'x'.repeat(1500)));
  assert.equal(await storage.getItem('auth'), 'existing session');
});

test('late work is rejected even when the same user signs back in', () => {
  switchAccount('user-a');
  const previous = captureAccount();
  switchAccount(null);
  switchAccount('user-a');
  assert.equal(isCurrentAccount(previous), false);
  assert.equal(isCurrentAccount(captureAccount()), true);
  switchAccount(null);
});
