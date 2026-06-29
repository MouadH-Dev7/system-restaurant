'use client';

import { memo } from 'react';
import type { OrderResponse } from '@repo/shared-types';
import type { TableOrderGroup } from '@/lib/group-orders-by-table';
import { KdsTableGroup } from '@/components/kds-table-group';
import { kitchenT } from '@/lib/i18n';

type KdsOrderGridProps = {
  pendingGroups: TableOrderGroup[];
  preparingGroups: TableOrderGroup[];
  readyGroups: TableOrderGroup[];
  highlightOrderId: string | null;
  alertBannerId: string | null;
  t: ReturnType<typeof kitchenT>;
  onChangeStatus: (orderId: string, status: OrderResponse['status']) => void;
};

export const KdsOrderGrid = memo(function KdsOrderGrid({
  pendingGroups,
  preparingGroups,
  readyGroups,
  highlightOrderId,
  alertBannerId,
  t,
  onChangeStatus,
}: KdsOrderGridProps) {
  const pendingHighlight = highlightOrderId ?? alertBannerId ?? null;

  return (
    <div className="flex h-full min-w-[1200px] gap-6">
      <section className="flex min-w-[360px] max-w-[420px] flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between rounded-lg border-l-4 border-primary-container bg-primary-container/5 p-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary-container">
              {t.pending}
            </h2>
            <span className="rounded bg-primary-container px-2 py-0.5 text-[11px] font-black text-on-primary-container">
              {String(pendingGroups.reduce((sum, g) => sum + g.orders.length, 0)).padStart(2, '0')}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {pendingGroups.map((group) => (
            <KdsTableGroup
              key={group.tableId}
              group={group}
              accent="pending"
              actionLabel={t.startPreparing}
              actionClassName="bg-primary-container text-on-primary-container"
              highlightOrderId={pendingHighlight}
              onAction={(orderId) => void onChangeStatus(orderId, 'PREPARING')}
            />
          ))}
        </div>
      </section>

      <section className="flex min-w-[360px] max-w-[420px] flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between rounded-lg border-l-4 border-secondary-container bg-secondary-container/5 p-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-secondary-container">
              {t.preparing}
            </h2>
            <span className="rounded bg-secondary-container px-2 py-0.5 text-[11px] font-black text-white">
              {String(preparingGroups.reduce((sum, g) => sum + g.orders.length, 0)).padStart(2, '0')}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {preparingGroups.map((group) => (
            <KdsTableGroup
              key={group.tableId}
              group={group}
              accent="preparing"
              actionLabel={t.markReady}
              actionClassName="bg-secondary-container text-white"
              highlightOrderId={highlightOrderId}
              onAction={(orderId) => void onChangeStatus(orderId, 'READY')}
            />
          ))}
        </div>
      </section>

      <section className="flex min-w-[360px] max-w-[420px] flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between rounded-lg border-l-4 border-tertiary-container bg-tertiary-container/5 p-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-tertiary-container">
              {t.ready}
            </h2>
            <span className="rounded bg-tertiary-container px-2 py-0.5 text-[11px] font-black text-white">
              {String(readyGroups.reduce((sum, g) => sum + g.orders.length, 0)).padStart(2, '0')}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {readyGroups.map((group) => (
            <KdsTableGroup
              key={group.tableId}
              group={group}
              accent="ready"
              actionLabel={t.completeOrder}
              actionClassName="bg-tertiary-container text-white"
              dimmed
              highlightOrderId={highlightOrderId}
              onAction={(orderId) => void onChangeStatus(orderId, 'DELIVERED')}
            />
          ))}
        </div>
      </section>
    </div>
  );
});
