import type { Language } from './types';

export function replaceTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    values[key] !== undefined ? String(values[key]) : match,
  );
}

function localizeValue<T extends Record<string, string | null | undefined>>(
  entity: T,
  language: Language,
  enField: keyof T,
  frField: keyof T,
  arField: keyof T,
  fallbackField?: keyof T,
): string {
  const field = language === 'ar' ? arField : language === 'fr' ? frField : enField;
  const value = entity[field];
  if (value && typeof value === 'string' && value.trim()) return value;
  if (fallbackField) {
    const fallback = entity[fallbackField];
    if (fallback && typeof fallback === 'string' && fallback.trim()) return fallback;
  }
  const en = entity[enField];
  if (en && typeof en === 'string' && en.trim()) return en;
  return '';
}


