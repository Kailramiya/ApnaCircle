import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { AppError } from '@/lib/errors';
import { assertCurrentAccount, captureAccount } from '@/lib/account';

export function mediaUrl(bucket: 'post-images' | 'profile-images', path: string | null) {
  return path ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : undefined;
}

export type PreparedPhoto = { uri: string; width: number; height: number };
export async function choosePhoto(maxDimension = 1600): Promise<PreparedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new AppError('photoDenied');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 0.85, exif: false });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) throw new AppError('photoTooLarge');
  const context = ImageManipulator.manipulate(asset.uri);
  try {
    if (Math.max(asset.width, asset.height) > maxDimension) context.resize(asset.width >= asset.height ? { width: maxDimension } : { height: maxDimension });
    const image = await context.renderAsync();
    try { return await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 }); }
    finally { image.release(); }
  } catch (error) { throw new AppError('photoFailed', { cause: error }); }
  finally { context.release(); }
}
export async function uploadPhoto(bucket: 'post-images' | 'profile-images', path: string, photo: PreparedPhoto) {
  const account = captureAccount();
  const bytes = await new File(photo.uri).arrayBuffer();
  assertCurrentAccount(account);
  if (bytes.byteLength > 10 * 1024 * 1024) throw new AppError('photoTooLarge');
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' });
  assertCurrentAccount(account);
  if (error) {
    // A previous attempt may have uploaded successfully before losing its response.
    // Paths are immutable and unique to the frozen submission, so existence is safe.
    const result = await supabase.storage.from(bucket).exists(path);
    assertCurrentAccount(account);
    if (!result.data) throw error;
  }
}
