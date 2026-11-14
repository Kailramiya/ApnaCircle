import { supabase } from '@/lib/supabase';
import { credentialsSchema, type Credentials } from '@/lib/models';

const callback = 'apnacircle://auth/callback';
export async function authenticate(input: Credentials, register: boolean) {
  const { email, password } = credentialsSchema.parse(input);
  const result = register
    ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback } })
    : await supabase.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data;
}
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${callback}?mode=recovery` });
  if (error) throw error;
}
export async function exchangeAuthCode(code: string) {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
