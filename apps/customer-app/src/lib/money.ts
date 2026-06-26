export function formatMoney(amount: number, currency = 'DZD') {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
