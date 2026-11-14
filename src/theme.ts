import type { TextStyle } from 'react-native';

export const colors = {
  primary: '#2563EB', primaryDark: '#1D4ED8', tint: '#EFF6FF',
  background: '#F8FAFC', surface: '#FFFFFF', text: '#0F172A',
  muted: '#475569', border: '#E2E8F0', success: '#166534',
  danger: '#B91C1C', dangerTint: '#FEF2F2', warm: '#FFF7ED', warmText: '#9A3412',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, hero: 48 };
export const radius = { sm: 8, md: 16, pill: 999 };
// System fonts support native text scaling and Hindi without a font-download gate.
export const type = {
  hero: { fontSize: 36, fontWeight: '800', letterSpacing: -1.2 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 25 },
  small: { fontSize: 14, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', lineHeight: 22 },
} satisfies Record<string, TextStyle>;
