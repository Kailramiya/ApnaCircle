import { createClient, processLock } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { CryptoDigestAlgorithm, digest, getRandomValues, randomUUID } from 'expo-crypto';
import { createSessionStorage } from './secure-session';
import { installPkceCrypto } from './pkce-crypto';

installPkceCrypto(globalThis, { getRandomValues, digest: (bytes) => digest(CryptoDigestAlgorithm.SHA256, bytes) });

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publicKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isConfigured = Boolean(url?.startsWith('https://') && !url.includes('YOUR_PROJECT') && publicKey && !publicKey.startsWith('YOUR_') && !publicKey.startsWith('sb_secret_'));
const storage = createSessionStorage({
  get: SecureStore.getItemAsync,
  set: (key, value) => SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  remove: SecureStore.deleteItemAsync,
}, randomUUID);
const timedFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const signal = init?.signal ?? (typeof input === 'object' && 'signal' in input ? input.signal : undefined);
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 20_000);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
};
export const supabase = createClient(url && isConfigured ? url : 'https://unconfigured.supabase.co', isConfigured && publicKey ? publicKey : 'not-configured', {
  auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce', lock: processLock },
  global: { fetch: timedFetch },
});
