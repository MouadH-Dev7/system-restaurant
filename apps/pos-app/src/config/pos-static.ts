import type { PaymentMethod } from '@/types/pos';

export const paymentMethods: PaymentMethod[] = [
  { id: 'cash', label: 'Cash', hint: 'Cash payment', backendMethod: 'CASH' },
  { id: 'card', label: 'Card', hint: 'Bank card payment', backendMethod: 'CARD' },
  {
    id: 'bank-transfer',
    label: 'Bank Transfer',
    hint: 'Direct bank transfer',
    backendMethod: 'BANK_TRANSFER',
  },
  {
    id: 'mobile-payment',
    label: 'Mobile Payment',
    hint: 'Wallet or mobile transfer',
    backendMethod: 'MOBILE_PAYMENT',
  },
];

export const liveActivityFallback = [
  {
    id: 'welcome',
    title: 'POS connected',
    detail: 'Orders and tables will appear here as service begins.',
    time: 'Now',
    tone: 'primary' as const,
  },
];
