import type { Language } from '@/types/menu';

const localeMap: Record<Language, string> = {
  ar: 'ar-MA',
  en: 'en-GB',
  fr: 'fr-FR',
};

export function formatOrderClock(createdAt: string, language: Language) {
  return new Intl.DateTimeFormat(localeMap[language], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt));
}
