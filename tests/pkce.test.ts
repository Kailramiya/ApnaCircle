import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { installPkceCrypto } from '../src/lib/pkce-crypto.ts';

test('PKCE fallback uses secure entropy and SHA-256 with the original byte range', async () => {
  const target: { crypto?: { getRandomValues: (a: Uint32Array) => Uint32Array; subtle: { digest: (algorithm: string, data: Uint8Array) => Promise<ArrayBuffer> } } } = {};
  installPkceCrypto(target, {
    getRandomValues: (bytes) => webcrypto.getRandomValues(bytes),
    digest: (bytes) => webcrypto.subtle.digest('SHA-256', bytes),
  });
  const api = target.crypto;
  assert.ok(api);
  const random = new Uint32Array(56);
  assert.equal(api.getRandomValues(random), random);
  assert.ok(random.some((number) => number !== 0));
  const input = new TextEncoder().encode('-abc-').subarray(1, 4);
  assert.equal(Buffer.from(await api.subtle.digest('SHA-256', input)).toString('hex'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  await assert.rejects(api.subtle.digest('MD5', input));
});
test('existing WebCrypto is preserved', () => {
  const target = { crypto: webcrypto };
  installPkceCrypto(target, { getRandomValues: () => { throw new Error('Should not replace entropy'); }, digest: async () => { throw new Error('Should not replace digest'); } });
  assert.equal(target.crypto, webcrypto);
});
