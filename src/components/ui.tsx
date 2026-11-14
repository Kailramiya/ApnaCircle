import type { PropsWithChildren } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type TextProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { colors, radius, space, type } from '@/theme';
import { useI18n } from '@/store/preferences';

export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: keyof typeof type }) {
  return <Text {...props} style={[{ color: colors.text }, type[variant], style]} />;
}
export function Icon({ name, color = colors.muted, size = 22 }: { name: SymbolViewProps['name']; color?: string; size?: number }) {
  return <SymbolView name={name} tintColor={color} size={size} style={{ width: size, height: size }} />;
}
export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }: {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const foreground = variant === 'primary' ? colors.surface : variant === 'danger' ? colors.danger : colors.primaryDark;
  return <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityLabel={title}
    accessibilityState={{ disabled: disabled || loading, busy: loading }} style={({ pressed }) => [styles.button, {
      backgroundColor: variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.tint : 'transparent',
      opacity: disabled ? 0.45 : pressed ? 0.65 : 1,
    }, style]}>
    {loading ? <ActivityIndicator color={foreground} /> : <AppText variant="label" style={{ color: foreground, textAlign: 'center' }}>{title}</AppText>}
  </Pressable>;
}
export function IconButton({ label, name, onPress, selected, disabled }: { label: string; name: SymbolViewProps['name']; onPress: () => void; selected?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.iconButton, { opacity: disabled ? 0.4 : pressed ? 0.55 : 1 }]}>
    <Icon name={name} color={selected ? colors.primary : colors.muted} />
  </Pressable>;
}
export function Field({ label, error, style, ...props }: TextInputProps & { label: string; error?: string }) {
  return <View style={{ gap: space.xs }}>
    <AppText variant="label">{label}</AppText>
    <TextInput {...props} accessibilityLabel={label} accessibilityHint={error} placeholderTextColor={colors.muted}
      style={[styles.input, props.multiline && { minHeight: 120, textAlignVertical: 'top' }, error ? { borderColor: colors.danger } : null, style]} />
    {error ? <AppText variant="small" accessibilityLiveRegion="polite" style={{ color: colors.danger }}>{error}</AppText> : null}
  </View>;
}
export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={96} style={{ flex: 1 }}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>{children}</ScrollView> : children}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Notice({ message, error = false, onRetry }: { message: string; error?: boolean; onRetry?: () => void }) {
  const { t } = useI18n();
  return <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: error ? colors.dangerTint : colors.tint }]}>
    <AppText variant="small" style={{ color: error ? colors.danger : colors.primaryDark }}>{message}</AppText>
    {onRetry ? <Button title={t('retry')} onPress={onRetry} variant="ghost" /> : null}
  </View>;
}
export function Loading() {
  const { t } = useI18n();
  return <View style={styles.empty}><ActivityIndicator color={colors.primary} accessibilityLabel={t('loading')} /><AppText variant="small">{t('loading')}</AppText></View>;
}
export function EmptyState({ title, body, children }: PropsWithChildren<{ title: string; body?: string }>) {
  return <View style={styles.empty}><View style={styles.circle}><Icon name={{ ios: 'bubble.left.and.bubble.right', android: 'forum' }} color={colors.primary} size={30} /></View>
    <AppText variant="heading" style={{ textAlign: 'center' }}>{title}</AppText>
    {body ? <AppText style={{ color: colors.muted, textAlign: 'center' }}>{body}</AppText> : null}{children}
  </View>;
}
export function Chips<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <View style={styles.row}>{options.map((option) => <Pressable key={option.value} onPress={() => onChange(option.value)} accessibilityRole="button"
    accessibilityState={{ selected: value === option.value }} style={({ pressed }) => [styles.chip, { backgroundColor: value === option.value ? colors.text : colors.surface, opacity: pressed ? 0.6 : 1 }]}>
    <AppText variant="label" style={{ color: value === option.value ? colors.surface : colors.muted }}>{option.label}</AppText>
  </Pressable>)}</View>;
}
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.xl, width: '100%', maxWidth: 720, alignSelf: 'center', flexGrow: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  section: { gap: space.lg },
  button: { minHeight: 48, paddingHorizontal: space.lg, paddingVertical: space.md, borderRadius: radius.sm, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: space.md, minHeight: 52, color: colors.text, ...type.body },
  notice: { padding: space.lg, gap: space.sm, borderRadius: radius.sm },
  empty: { paddingVertical: space.hero, paddingHorizontal: space.xl, alignItems: 'center', gap: space.lg },
  circle: { width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 48, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
