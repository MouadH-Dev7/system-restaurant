'use client';

import { useEffect } from 'react';
import { useLanguageStore } from '@/store/language.store';

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const language = useLanguageStore((state) => state.language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return children;
}
