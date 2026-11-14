import { Image } from 'expo-image';
import { View } from 'react-native';
import { AppText } from './ui';
import { colors, radius } from '@/theme';
import { mediaUrl } from '@/services/media';

export function Avatar({ name, path, size = 44 }: { name: string; path: string | null; size?: number }) {
  const style = { width: size, height: size, borderRadius: radius.pill };
  return path ? <Image source={mediaUrl('profile-images', path)} style={style} contentFit="cover" accessible={false} />
    : <View accessible={false} style={[style, { backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }]}><AppText variant="heading" style={{ color: colors.primaryDark }}>{Array.from(name.trim())[0]?.toLocaleUpperCase()}</AppText></View>;
}
