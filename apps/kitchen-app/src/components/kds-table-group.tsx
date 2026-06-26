'use client';

import type { OrderResponse } from '@repo/shared-types';
import { KdsOrderCard } from '@/components/kds-order-card';
import type { TableOrderGroup } from '@/lib/group-orders-by-table';
import { kitchenT, localizeGroupLabel, replaceTemplate } from '@/lib/i18n';
import { formatOrderClock } from '@/lib/order-utils';
import { useAppStore } from '@/store/app.store';

type KdsTableGroupProps = {
  group: TableOrderGroup;
  accent: 'pending' | 'preparing' | 'ready';
  actionLabel: string;
  actionClassName: string;
  dimmed?: boolean;
  onAction: (orderId: string) => void;
  highlightOrderId?: string | null;
};

export function KdsTableGroup({
  group,
  accent,
  actionLabel,
  actionClassName,
  dimmed = false,
  onAction,
  highlightOrderId,
}: KdsTableGroupProps) {
  const language = useAppStore((state) => state.language);
  const t = kitchenT(language);
  const ticketLabel = group.orders.length === 1 ? t.ticketSingular : t.ticketPlural;

  return (
    <article
      className={`glass-card overflow-hidden rounded-lg border bg-surface-container-low/40 ${
        group.isExternal ? 'border-error/40 ring-1 ring-error/30' : 'border-white/10'
      }`}
    >
      <header className="flex items-center justify-between border-b border-white/10 bg-surface-container-high/80 px-4 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant">
            {group.isExternal ? t.externalOrder : t.tableGroup}
          </p>
          <h3 className="text-2xl font-black text-on-surface">
            {localizeGroupLabel(group, language)}
          </h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-black ${
            group.isExternal
              ? 'bg-error/20 text-error'
              : 'bg-primary-container/20 text-primary-container'
          }`}
        >
          {group.orders.length} {ticketLabel}
        </span>
      </header>

      <div className="divide-y divide-white/10">
        {group.orders.map((order: OrderResponse) => (
          <KdsOrderCard
            key={order.id}
            order={order}
            accent={accent}
            actionLabel={actionLabel}
            actionClassName={actionClassName}
            dimmed={dimmed}
            compact
            highlight={highlightOrderId === order.id}
            orderedAtLabel={replaceTemplate(t.orderedAt, {
              time: formatOrderClock(order.createdAt),
            })}
            onAction={() => onAction(order.id)}
          />
        ))}
      </div>
    </article>
  );
}
