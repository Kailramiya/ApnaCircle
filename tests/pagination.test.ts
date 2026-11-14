import test from 'node:test';
import assert from 'node:assert/strict';
import { nextCursor, PAGE_SIZE, uniqueRows } from '../src/lib/pagination.ts';

test('cursor preserves microseconds and uses saved-record identity', () => {
  const page = Array.from({ length: PAGE_SIZE }, (_, i) => ({ id: `post-${i}`, sort_at: '2026-11-01T10:00:00.123456+00:00', sort_id: `saved-${i}` }));
  assert.deepEqual(nextCursor(page), { time: '2026-11-01T10:00:00.123456+00:00', id: 'saved-19' });
  assert.equal(nextCursor(page.slice(1)), undefined);
  assert.equal(nextCursor([]), undefined);
});
test('overlapping pages never render duplicate entity rows', () => {
  assert.deepEqual(uniqueRows([[{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }]]), [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
});
