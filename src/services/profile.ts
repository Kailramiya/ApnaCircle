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
  if (error) {
    if (isNew) {
      // The first onboarding insert may have committed before its response was lost.
      const existing = await supabase.from('profiles').select('*').eq('id', account.id).maybeSingle();
      assertCurrentAccount(account);
      if (!existing.error && existing.data) return profileSchema.parse(existing.data);
    }
    throw error;
  }
  return profileSchema.parse(data);
}

export async function savePreferences(locality: ProfileInput['locality'], language: ProfileInput['preferred_language']) {
  const account = captureAccount();
  const values = profileInput.pick({ locality: true, preferred_language: true }).parse({ locality, preferred_language: language });
  const { data, error } = await supabase.from('profiles').update(values).eq('id', account.id).select('*').single();
  assertCurrentAccount(account);
  if (error) throw error;
  return profileSchema.parse(data);
}
