import { supabase } from '@/lib/supabase';
import { profileInput, profileSchema, type ProfileInput } from '@/lib/models';
import { assertCurrentAccount, captureAccount } from '@/lib/account';

export async function getProfile(id: string, signal: AbortSignal) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).abortSignal(signal).maybeSingle();
  if (error) throw error;
  return data ? profileSchema.parse(data) : null;
}
export async function saveProfile(input: ProfileInput, isNew: boolean, avatarPath?: string | null) {
  const account = captureAccount();
  const values = { ...profileInput.parse(input), ...(avatarPath !== undefined ? { avatar_path: avatarPath } : {}) };
  const request = isNew ? supabase.from('profiles').insert({ id: account.id, ...values }) : supabase.from('profiles').update(values).eq('id', account.id);
  const { data, error } = await request.select('*').single();
  assertCurrentAccount(account);
  if (error) throw error;
  return profileSchema.parse(data);
}
