// Supabase's PKCE implementation reads WebCrypto globals. Hermes may not supply
// them. Reuse native crypto rather than allowing its Math.random/plain fallback.
export function installPkceCrypto(target: object, native: {
  getRandomValues: (bytes: Uint32Array) => Uint32Array;
  digest: (bytes: BufferSource) => Promise<ArrayBuffer>;
}) {
  const existing: unknown = Reflect.get(target, 'crypto');
  const crypto = typeof existing === 'object' && existing !== null ? existing : {};
  if (typeof Reflect.get(crypto, 'getRandomValues') !== 'function') Object.defineProperty(crypto, 'getRandomValues', { value: native.getRandomValues, configurable: true });
  if (!Reflect.get(crypto, 'subtle')) {
    // ponytail: only the SHA-256 operation used by PKCE is supplied. Adopt a full
    // WebCrypto implementation before adding client JWT verification/key APIs.
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: {
      digest: (algorithm: string | { name: string }, bytes: BufferSource) => {
        const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
        if (name.toUpperCase() !== 'SHA-256') return Promise.reject(new Error('Unsupported digest algorithm'));
        return native.digest(bytes);
      },
    } });
  }
  if (existing !== crypto) Object.defineProperty(target, 'crypto', { value: crypto, configurable: true });
}
