export function formatMoney(amount: number, locale = 'ar-DZ', currency = 'DZD') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatOrderNumber(dailyOrderNumber: number) {
  return String(dailyOrderNumber);
}

export function formatTime(isoDate: string) {
  const date = new Date(isoDate);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatRelativeTime(isoDate: string) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} hr ago`;
}

export function formatReceiptDate(isoDate: string) {
  return new Intl.DateTimeFormat('ar-DZ', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function formatReceiptTime(isoDate: string) {
  return new Intl.DateTimeFormat('ar-DZ', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}
