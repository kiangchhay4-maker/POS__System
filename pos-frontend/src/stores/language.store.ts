import { create } from 'zustand';
import { translations, type Language, type TranslationKey } from '../i18n/translations';

const LANGUAGE_KEY = 'coffee_pos_language';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: (localStorage.getItem(LANGUAGE_KEY) as Language) || 'km', // Default to Khmer as requested by user

  setLanguage: (language: Language) => {
    localStorage.setItem(LANGUAGE_KEY, language);
    set({ language });
  },

  toggleLanguage: () => {
    const nextLang: Language = get().language === 'km' ? 'en' : 'km';
    localStorage.setItem(LANGUAGE_KEY, nextLang);
    set({ language: nextLang });
  },

  t: (key: TranslationKey): string => {
    const lang = get().language;
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || key;
  },
}));
