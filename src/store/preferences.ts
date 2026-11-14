import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { translate, type Language, type MessageKey } from '@/lib/translations';

export const usePreferences = create<{ language: Language; setLanguage: (language: Language) => void }>()(
  persist((set) => ({
    language: getLocales()[0]?.languageCode === 'hi' ? 'hi' : 'en',
    setLanguage: (language) => set({ language }),
  }), { name: 'apnacircle-preferences', storage: createJSONStorage(() => AsyncStorage) }),
);
export function useI18n() {
  const language = usePreferences((s) => s.language);
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  return {
    language,
    t: (key: MessageKey, values?: Record<string, string | number>) => translate(language, key, values),
    number: (value: number) => new Intl.NumberFormat(locale).format(value),
    date: (value: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)),
    money: (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value),
  };
}
