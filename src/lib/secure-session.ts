// New chunks are written before switching the manifest. Failed writes preserve
// the previous session; operations share a serial queue in this process.
export function createSessionStorage(storage: {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
}, revision: () => string) {
  let queue = Promise.resolve();
  function serial<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.then(() => undefined, () => undefined);
    return result;
  }
  function manifest(raw: string | null): { revision: string; count: number } | null {
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || !('revision' in value) || !('count' in value)
      || typeof value.revision !== 'string' || !/^[a-zA-Z0-9-]+$/.test(value.revision)
      || typeof value.count !== 'number' || !Number.isInteger(value.count) || value.count < 1 || value.count > 256) throw new Error('Invalid session manifest');
    return { revision: value.revision, count: value.count };
  }
  async function clean(key: string, old: ReturnType<typeof manifest>) {
    if (!old) return;
    const results = await Promise.allSettled(Array.from({ length: old.count }, (_, i) => storage.remove(`${key}.${old.revision}.${i}`)));
    if (results.some((result) => result.status === 'rejected')) console.warn('Obsolete encrypted session chunks could not be removed.');
  }
  return {
    getItem: (key: string) => serial(async () => {
      const current = manifest(await storage.get(key));
      if (!current) return null;
      const chunks = await Promise.all(Array.from({ length: current.count }, (_, i) => storage.get(`${key}.${current.revision}.${i}`)));
      if (chunks.some((part) => part === null)) throw new Error('Incomplete encrypted session');
      return chunks.join('');
    }),
    setItem: (key: string, value: string) => serial(async () => {
      const old = manifest(await storage.get(key));
      const characters = Array.from(value);
      const parts: string[] = [];
      for (let i = 0; i < characters.length; i += 450) parts.push(characters.slice(i, i + 450).join(''));
      if (parts.length === 0 || parts.length > 256) throw new Error('Session size is unsupported');
      const current = { revision: revision(), count: parts.length };
      try {
        for (const [i, part] of parts.entries()) await storage.set(`${key}.${current.revision}.${i}`, part);
        await storage.set(key, JSON.stringify(current));
      } catch (error) { await clean(key, current); throw error; }
      await clean(key, old);
    }),
    removeItem: (key: string) => serial(async () => {
      const old = manifest(await storage.get(key));
      await storage.remove(key);
      await clean(key, old);
    }),
  };
}
