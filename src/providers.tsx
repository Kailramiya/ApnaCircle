import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, QueryClientProvider, focusManager, onlineManager, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { switchAccount } from '@/lib/account';
import { getProfile } from '@/services/profile';
import { usePreferences } from '@/store/preferences';
import type { Profile } from '@/lib/models';

type AuthState = {
  session: Session | null; ready: boolean; error: boolean; profile: Profile | null | undefined;
  profilePending: boolean; profileError: boolean; retryProfile: () => void; retrySession: () => void;
  recovery: boolean; setRecovery: (value: boolean) => void;
};
const AuthContext = createContext<AuthState | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
function AuthProvider({ children }: PropsWithChildren) {
  const client = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    let mounted = true;
    let events = 0;
    setReady(false);
    const apply = (next: Session | null) => {
      if (!mounted) return;
      if (switchAccount(next?.user.id ?? null)) {
        void client.cancelQueries().catch(() => console.warn('Previous queries could not be cancelled.'));
        client.clear();
      }
      setSession(next);
      if (!next) setRecovery(false);
      setReady(true); setError(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      events += 1;
      if (event === 'PASSWORD_RECOVERY' && mounted) setRecovery(true);
      apply(next);
    });
    const version = events;
    void supabase.auth.getSession().then(({ data, error: authError }) => {
      if (!mounted || version !== events) return;
      if (authError) { setError(true); setReady(true); } else apply(data.session);
    }).catch(() => { if (mounted) { setError(true); setReady(true); } });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [client, attempt]);
  const userId = session?.user.id;
  const profile = useQuery({ queryKey: [userId, 'profile'], queryFn: ({ signal }) => {
    if (!userId) throw new Error('No active account');
    return getProfile(userId, signal);
  }, enabled: Boolean(userId) });
  const preferredLanguage = profile.data?.preferred_language;
  useEffect(() => { if (preferredLanguage) usePreferences.getState().setLanguage(preferredLanguage); }, [preferredLanguage]);
  return <AuthContext.Provider value={{ session, ready, error, profile: profile.data, profilePending: Boolean(session) && profile.isPending,
    profileError: profile.isError, retryProfile: () => { void profile.refetch(); }, retrySession: () => setAttempt((n) => n + 1), recovery, setRecovery }}>{children}</AuthContext.Provider>;
}
function Lifecycle() {
  useEffect(() => {
    const apply = (state: string) => {
      focusManager.setFocused(state === 'active');
      const refresh = state === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh();
      void refresh.catch(() => console.warn('Session refresh lifecycle update failed.'));
    };
    apply(AppState.currentState);
    const subscription = AppState.addEventListener('change', apply);
    const unsubscribe = NetInfo.addEventListener((state) => onlineManager.setOnline(state.isConnected !== false && state.isInternetReachable !== false));
    return () => { subscription.remove(); unsubscribe(); void supabase.auth.stopAutoRefresh().catch(() => console.warn('Session refresh cleanup failed.')); };
  }, []);
  return null;
}
export function Providers({ children }: PropsWithChildren) {
  const [client] = useState(() => new QueryClient({ defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 10 * 60_000, retry: 1 },
    // No queued writes: a disconnected mutation must fail and preserve input.
    mutations: { retry: false, networkMode: 'always' },
  } }));
  return <QueryClientProvider client={client}><Lifecycle /><AuthProvider>{children}</AuthProvider></QueryClientProvider>;
}
