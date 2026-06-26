import type { OrderStatus } from '@repo/shared-types';
import type { Language } from '@/types/menu';
import { t } from '@/lib/i18n';

export function getOrderProgress(status: OrderStatus | undefined) {
  switch (status) {
    case 'PREPARING':
      return 50;
    case 'READY':
      return 75;
    case 'DELIVERED':
    case 'PAID':
      return 100;
    case 'CANCELLED':
      return 0;
    default:
      return 25;
  }
}

export function isStepActive(
  status: OrderStatus | undefined,
  step: 'pending' | 'preparing' | 'ready' | 'delivered',
) {
  if (!status) {
    return step === 'pending';
  }

  const rank: Record<OrderStatus, number> = {
    PENDING: 0,
    PREPARING: 1,
    READY: 2,
    DELIVERED: 3,
    PAID: 4,
    CANCELLED: -1,
  };

  const stepRank = { pending: 0, preparing: 1, ready: 2, delivered: 3 }[step];
  return rank[status] >= stepRank && status !== 'CANCELLED';
}

export function getStatusLabel(status: OrderStatus | undefined, language: Language) {
  const copy = t(language);
  switch (status) {
    case 'PREPARING':
      return copy.statusPreparing;
    case 'READY':
      return copy.statusReady;
    case 'DELIVERED':
      return copy.statusDelivered;
    case 'PAID':
      return copy.statusPaid;
    case 'CANCELLED':
      return copy.statusCancelled;
    default:
      return copy.statusPending;
  }
}

export function getStatusHeadline(status: OrderStatus | undefined, language: Language) {
  const copy = t(language);
  switch (status) {
    case 'PREPARING':
      return copy.headlinePreparing;
    case 'READY':
      return copy.headlineReady;
    case 'DELIVERED':
    case 'PAID':
      return copy.headlineDelivered;
    default:
      return copy.successTitle;
  }
}
