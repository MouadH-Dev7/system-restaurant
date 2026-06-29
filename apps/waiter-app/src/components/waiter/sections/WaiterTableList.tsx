'use client';

import { memo } from 'react';
import { Search } from 'lucide-react';
import type { OrderResponse, TableDTO } from '@repo/shared-types';
import type { WaiterLanguage } from '@/store/waiter.store';
import { getOrderForTable } from '@/store/waiter.store';
import { formatCountLabel, localizeOrderStatus, localizeTableLabel, waiterT } from '@/lib/i18n';

type WaiterTableListProps = {
  waiterName: string | null;
  waiterRole: string | null;
  orders: OrderResponse[];
  selectedTableId: string | null;
  tableSearch: string;
  language: WaiterLanguage;
  isRtl: boolean;
  activeTables: number;
  readyOrders: number;
  filteredTables: TableDTO[];
  onSelectTable: (tableId: string) => void;
  onSearchChange: (value: string) => void;
};

function tableBadge(order: OrderResponse | null, table: TableDTO, language: WaiterLanguage) {
  const t = waiterT(language);

  if (order?.status === 'READY') {
    return {
      label: t.ready,
      hint: `${t.tickets} #${order.displayOrderId ?? order.dailyOrderNumber}`,
      tone: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
      dot: 'bg-emerald-500',
    };
  }

  if (order?.status === 'DELIVERED') {
    return {
      label: t.waitingPayment,
      hint: `${t.tickets} #${order.displayOrderId ?? order.dailyOrderNumber}`,
      tone: 'bg-rose-100 text-rose-700 ring-rose-200',
      dot: 'bg-rose-500',
    };
  }

  if (order) {
    return {
      label: t.statusOccupied,
      hint: `${localizeOrderStatus(order.status, language)} • #${order.dailyOrderNumber}`,
      tone: 'bg-amber-100 text-amber-700 ring-amber-200',
      dot: 'bg-amber-500',
    };
  }

  if (table.status === 'RESERVED') {
    return {
      label: t.reserved,
      hint: formatCountLabel(table.capacity, t.seat, t.seats, language),
      tone: 'bg-slate-200 text-slate-700 ring-slate-200',
      dot: 'bg-slate-500',
    };
  }

  return {
    label: t.available,
    hint: formatCountLabel(table.capacity, t.seat, t.seats, language),
    tone: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  };
}

function WaiterTableListComponent(props: WaiterTableListProps) {
  const {
    waiterName,
    waiterRole,
    orders,
    selectedTableId,
    tableSearch,
    language,
    isRtl,
    activeTables,
    readyOrders,
    filteredTables,
    onSelectTable,
    onSearchChange,
  } = props;

  const t = waiterT(language);

  return (
    <aside className="w-full border-b border-[#ead4c2] bg-white/78 px-4 py-4 backdrop-blur xl:w-[300px] xl:max-w-[300px] xl:border-b-0 xl:border-r xl:px-4 xl:py-5">
      <div className="rounded-[26px] border border-[#efdbcb] bg-white px-4 py-4 shadow-[0_16px_45px_rgba(116,58,28,0.10)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#b55229]">
              {waiterName ?? t.waiterService}
            </p>
            <p className="mt-1 text-sm text-slate-500">{waiterRole ?? t.service}</p>
          </div>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#b55229]">{t.diningRoom}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-[18px] bg-[#fff4ec] p-3">
            <p className="text-xs text-slate-500">{t.activeTables}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{activeTables}</p>
          </div>
          <div className="rounded-[18px] bg-[#eefaf3] p-3">
            <p className="text-xs text-slate-500">{t.readyOrders}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{readyOrders}</p>
          </div>
        </div>
      </div>

      <label className="mt-5 flex items-center gap-3 rounded-[20px] border border-[#ead8c8] bg-white px-4 py-3 shadow-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={tableSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
          placeholder={t.searchTablePlaceholder}
        />
      </label>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:max-h-[calc(100vh-280px)] xl:flex-col xl:overflow-y-auto xl:pr-1">
        {filteredTables.map((table) => {
          const tableOrder = getOrderForTable(orders, table.id);
          const badge = tableBadge(tableOrder, table, language);
          const active = selectedTableId === table.id;

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => onSelectTable(table.id)}
              className={`rounded-[24px] border px-4 py-4 transition ${
                active
                  ? 'border-[#ca6f48] bg-[#fff3ea] shadow-[0_18px_36px_rgba(162,80,35,0.18)]'
                  : 'border-[#eddccf] bg-white hover:border-[#ddb398] hover:bg-[#fffaf6]'
              } ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b55229]">{t.table}</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {localizeTableLabel(table.number, language)}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{badge.hint}</p>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${badge.tone}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export const WaiterTableList = memo(WaiterTableListComponent);
