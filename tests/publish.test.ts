import test from 'node:test';
import assert from 'node:assert/strict';
import { publishOnce, UnconfirmedPublish } from '../src/lib/publish.ts';

test('retry returns an existing post without uploading or inserting again', async () => {
  const post = { id: 'stable-id' };
  const result = await publishOnce({ find: async () => post, upload: async () => assert.fail('Uploaded twice'), insert: async () => { throw new Error('Inserted twice'); } });
  assert.equal(result, post);
});
test('lost insert response reconciles the committed post', async () => {
  let committed: { id: string } | null = null;
  let writes = 0;
  const result = await publishOnce({
    find: async () => committed, upload: async () => undefined,
    insert: async () => { writes++; committed = { id: 'same-id' }; throw new Error('Response lost'); },
  });
  assert.equal(result.id, 'same-id');
  assert.equal(writes, 1);
});
test('an unconfirmed write can be reconciled on a later retry without another write', async () => {
  await assert.rejects(publishOnce({ find: async () => null, upload: async () => undefined, insert: async () => { throw new Error('Offline'); } }), UnconfirmedPublish);
  const result = await publishOnce({ find: async () => ({ id: 'same-id' }), upload: async () => assert.fail('Re-uploaded a confirmed post'), insert: async () => { throw new Error('Unexpected duplicate'); } });
  assert.equal(result.id, 'same-id');
});
test('failed photo upload does not attempt the post insert', async () => {
  await assert.rejects(publishOnce({ find: async () => null, upload: async () => { throw new Error('Upload denied'); }, insert: async () => assert.fail('Inserted without image') }), UnconfirmedPublish);
});
