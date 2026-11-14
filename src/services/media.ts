import { supabase } from '@/lib/supabase';

export function mediaUrl(bucket: 'post-images' | 'profile-images', path: string | null) {
  return path ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : undefined;
}
