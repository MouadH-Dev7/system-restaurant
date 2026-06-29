import type { WaiterLanguage } from '@/store/waiter.store';

function localeForLanguage(language: WaiterLanguage) {
  if (language === 'fr') {
    return 'fr-FR';
  }

  if (language === 'ar') {
    return 'ar-DZ';
  }

  return 'en-US';
}

export function formatMoney(amount: number, language: WaiterLanguage = 'en') {
  return new Intl.NumberFormat(localeForLanguage(language), {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(value: string, language: WaiterLanguage = 'en') {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatElapsedMinutes(value: string, language: WaiterLanguage = 'en') {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (language === 'ar') {
    return `${minutes} د`;
  }

  if (language === 'fr') {
    return `${minutes} min`;
  }

  return `${minutes} min`;
}
