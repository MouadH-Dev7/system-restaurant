'use client';

import { create } from 'zustand';
import type { Language } from '@/types/menu';

const CUSTOMER_LANGUAGE_STORAGE_KEY = 'khalou-fodil:customer-language';

function readStoredLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'ar';
  }

  const value = window.localStorage.getItem(CUSTOMER_LANGUAGE_STORAGE_KEY);
  return value === 'en' || value === 'fr' || value === 'ar' ? value : 'ar';
}

type LanguageState = {
  language: Language;
  setLanguage: (language: Language) => void;
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: readStoredLanguage(),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CUSTOMER_LANGUAGE_STORAGE_KEY, language);
    }
    set({ language });
  },
}));
