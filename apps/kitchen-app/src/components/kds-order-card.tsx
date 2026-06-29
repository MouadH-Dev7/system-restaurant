'use client';

import { memo } from 'react';
import { getOrderTypeLabel } from '@repo/shared-types';
import type { OrderResponse } from '@repo/shared-types';
import { ElapsedTimer } from '@/components/kitchen-sections';
import {
  kitchenT,
  localizeMenuItemName,
  localizeModifierName,
  localizeOrderChannel,
  localizeOrderTypeLabel,
} from '@/lib/i18n';
import { formatOrderNumber, isLateOrder } from '@/lib/order-utils';
import { useAppStore } from '@/store/app.store';

type KdsOrderCardProps = {
  order: OrderResponse;
  accent: 'pending' | 'preparing' | 'ready';
  actionLabel: string;
  actionClassName: string;
  onAction: () => void;
  dimmed?: boolean;
  compact?: boolean;
  orderedAtLabel?: string;
  highlight?: boolean;
};

const accentBorder = {
  pending: 'border-primary-container',
  preparing: 'border-secondary-container',
  ready: 'border-tertiary-container',
};

export const KdsOrderCard = memo(function KdsOrderCard({
  order,
  accent,
  actionLabel,
  actionClassName,
  onAction,
  dimmed = false,
  compact = false,
  orderedAtLabel,
  highlight = false,
}: KdsOrderCardProps) {
  const language = useAppStore((state) => state.language);
  const t = kitchenT(language);
  const orderType = getOrderTypeLabel(order);
  const late = isLateOrder(order.createdAt, order.status);
  const localizedTypeLabel = localizeOrderTypeLabel(order, language);
  const channelLabel = localizeOrderChannel(order, language);

  return (
    <div
      className={`${compact ? '' : 'glass-card rounded-lg'} overflow-hidden flex flex-col border-l-4 ${accentBorder[accent]} ${
        late ? 'border-2 timer-pulse-red' : ''
      } ${highlight ? 'ring-4 ring-error animate-pulse shadow-[0_0_30px_rgba(255,80,80,0.55)]' : ''} ${
        dimmed ? 'opacity-80 hover:opacity-100 transition-opacity' : ''
      }`}
    >
      <div
        className={`p-4 flex justify-between items-start border-b border-white/5 ${
          late ? 'bg-error/5' : highlight ? 'bg-error/10' : ''
        }`}
      >
        <div>
          <h3
            className="text-4xl text-on-surface leading-none tracking-tighter font-bold"
            style={{ fontFamily: 'var(--font-jetbrains)' }}
          >
            {formatOrderNumber(order)}
          </h3>
          {!compact ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                  orderType.type === 'external'
                    ? 'bg-error/20 text-error'
                    : 'bg-surface-variant/50 text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {orderType.type === 'external' ? 'local_shipping' : 'table_restaurant'}
                </span>
                {channelLabel}
              </span>
              <span className="text-xs font-bold uppercase text-on-surface-variant">
                {localizedTypeLabel}
              </span>
            </div>
          ) : orderedAtLabel ? (
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              {orderedAtLabel}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end">
          <span
            className={`font-black text-sm flex items-center gap-1 px-2 py-1 rounded ${
              late
                ? 'text-error bg-error/10'
                : accent === 'preparing'
                  ? 'text-secondary-container bg-secondary-container/10'
                  : accent === 'ready'
                    ? 'text-tertiary-container bg-tertiary-container/10'
                    : 'text-primary-container bg-primary-container/10'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {accent === 'ready' ? 'check_circle' : late ? 'schedule' : 'timer'}
            </span>
            {accent === 'ready' ? t.readyBadge : <ElapsedTimer createdAt={order.createdAt} />}
          </span>
        </div>
      </div>

      <div className={`p-4 flex-1 space-y-4 ${dimmed ? 'opacity-40' : ''}`}>
        <div>
          <p className="mb-2 border-b border-outline-variant/20 pb-1 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
            {t.orderItems}
          </p>
          <div className="space-y-2">
            {(order.items ?? []).map((item) => (
              <div key={item.id} className="flex flex-col">
                <div className="flex justify-between items-start">
                  <span
                    className={`font-bold text-lg text-on-surface ${dimmed ? 'line-through' : ''}`}
                  >
                    {item.quantity}x{' '}
                    {item.menuItem ? localizeMenuItemName(item.menuItem, language) : t.itemFallback}
                  </span>
                </div>
                {item.modifiers?.length ? (
                  <div className="mt-1 ml-2 flex flex-col gap-1">
                    {item.modifiers.map((modifier) => (
                      <span
                        key={modifier.id}
                        className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant"
                      >
                        + {localizeModifierName(modifier, language)}
                      </span>
                    ))}
                  </div>
                ) : null}
                {item.notes ? (
                  <div className="mt-1 ml-2 flex items-center gap-2 rounded-r border-l-2 border-error bg-error/10 px-2 py-1">
                    <span className="material-symbols-outlined text-[14px] text-error">
                      warning
                    </span>
                    <span className="text-[10px] font-black uppercase text-error">
                      {t.notes}: {item.notes}
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onAction}
        className={`w-full h-12 font-black text-sm tracking-widest hover:brightness-110 active-btn uppercase transition-all ${actionClassName}`}
      >
        {actionLabel}
      </button>
    </div>
  );
});
