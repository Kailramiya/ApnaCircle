import test from 'node:test';
import assert from 'node:assert/strict';
import { en, hi, translate, type MessageKey } from '../src/lib/translations.ts';

test('Hindi has the same keys and interpolation parameters as English', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(hi).sort());
  for (const key of Object.keys(en) as MessageKey[]) {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    assert.ok(hi[key].trim(), `Missing Hindi content: ${key}`);
    assert.deepEqual(placeholders(en[key]), placeholders(hi[key]), key);
  }
  assert.equal(translate('en', 'likes', { count: 2 }), '2 likes');
  assert.equal(translate('hi', 'notificationLike', { name: 'Aman' }), 'Aman ने आपकी पोस्ट पसंद की');
});
