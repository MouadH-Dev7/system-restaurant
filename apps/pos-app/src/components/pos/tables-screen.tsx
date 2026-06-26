'use client';

import { useMemo, useRef, useState } from 'react';
import { CreditCard, Plus, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { usePosTableSync } from '@/hooks/use-pos-table-sync';
import { computeOrderTotal, findTable, usePosTablesView } from '@/hooks/use-pos-selectors';
import { usePosOrderActions } from '@/hooks/use-pos-order-actions';
import { formatMoney } from '@/lib/format';
import {
  formatCountLabel,
  localizeMenuItemName,
  localizeTableStatus,
  localizeUiStatus,
  posT,
} from '@/lib/i18n';
import { usePosUiStore } from '@/store/pos-ui.store';
import { usePosDataStore } from '@/store/pos-data.store';
import { getTableBilling, updateTable } from '@/services/tables.service';

const tableTone = {
  available: 'bg-emerald-500 text-white',
  occupied: 'bg-emerald-600 text-white',
  reserved: 'bg-amber-500 text-white',
  preparing: 'bg-[#8a5a3b] text-white',
} as const;

export function TablesScreen() {
  const diningTables = usePosTablesView();
  const language = usePosUiStore((state) => state.language);
  const selectedTableId = usePosUiStore((state) => state.selectedTableId);
  const selectTable = usePosUiStore((state) => state.selectTable);
  const selectOrder = usePosUiStore((state) => state.selectOrder);
  const setActiveScreen = usePosUiStore((state) => state.setActiveScreen);
  const startTableCompose = usePosUiStore((state) => state.startTableCompose);
  const { openCheckout } = usePosOrderActions();
  const tables = usePosDataStore((state) => state.tables);
  const orders = usePosDataStore((state) => state.orders);
  const setTableBilling = usePosDataStore((state) => state.setTableBilling);
  const setTables = usePosDataStore((state) => state.setTables);
  usePosTableSync(true);
  const selectedTable = selectedTableId ? findTable(diningTables, selectedTableId) : undefined;
  const totals = computeOrderTotal(selectedTable?.remainingAmount ?? 0);
  const t = posT(language);
  const [zoom, setZoom] = useState(1);
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [moveMode, setMoveMode] = useState(false);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [savingLayoutId, setSavingLayoutId] = useState<string | null>(null);
  const [positionOverrides, setPositionOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const mapRef = useRef<HTMLDivElement | null>(null);

  const floorNames = useMemo(
    () =>
      Array.from(new Set(diningTables.map((table) => table.floorName)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [diningTables],
  );

  const visibleTables = useMemo(
    () =>
      selectedFloor === 'ALL'
        ? diningTables
        : diningTables.filter((table) => table.floorName === selectedFloor),
    [diningTables, selectedFloor],
  );
  const fallbackTable = visibleTables[0];
  const activeTable = selectedTable ?? fallbackTable;
  const activeTableOrders = useMemo(
    () =>
      activeTable
        ? orders
            .filter(
              (order) =>
                order.tableId === activeTable.id &&
                order.status !== 'PAID' &&
                order.status !== 'CANCELLED',
            )
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        : [],
    [activeTable, orders],
  );
  const moveButtonLabel =
    language === 'ar'
      ? moveMode
        ? 'إنهاء التحريك'
        : 'تحريك الطاولة'
      : language === 'fr'
        ? moveMode
          ? 'Terminer le placement'
          : 'Deplacer la table'
        : moveMode
          ? 'Finish moving'
          : 'Move table';

  function resolvePosition(tableId: string, x: number, y: number) {
    return positionOverrides[tableId] ?? { x, y };
  }

  function readMapPosition(clientX: number, clientY: number) {
    const element = mapRef.current;
    if (!element) {
      return null;
    }

    const rect = element.getBoundingClientRect();
    const nextX = ((clientX - rect.left) / rect.width) * 100;
    const nextY = ((clientY - rect.top) / rect.height) * 100;

    return {
      x: Math.min(92, Math.max(8, Number(nextX.toFixed(2)))),
      y: Math.min(82, Math.max(10, Number(nextY.toFixed(2)))),
    };
  }

  async function persistTablePosition(tableId: string, x: number, y: number) {
    setSavingLayoutId(tableId);

    try {
      const updated = await updateTable(tableId, { posX: x, posY: y });
      setTables(
        tables.map((table) => (table.id === updated.id ? updated : table)),
      );
      setPositionOverrides((current) => {
        const next = { ...current };
        delete next[tableId];
        return next;
      });
    } finally {
      setSavingLayoutId(null);
    }
  }

  function handlePointerMove(clientX: number, clientY: number) {
    if (!draggingTableId || !moveMode) {
      return;
    }

    const nextPosition = readMapPosition(clientX, clientY);
    if (!nextPosition) {
      return;
    }

    setPositionOverrides((current) => ({
      ...current,
      [draggingTableId]: nextPosition,
    }));
  }

  async function handlePointerUp() {
    if (!draggingTableId) {
      return;
    }

    const override = positionOverrides[draggingTableId];
    const releasedTableId = draggingTableId;
    setDraggingTableId(null);

    if (!override) {
      return;
    }

    await persistTablePosition(releasedTableId, override.x, override.y);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-[28px] border border-white/70 bg-white/80 p-5">
        <div>
          <h2 className="text-2xl font-bold">{t.tablesTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{t.tablesSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
            <Search size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {formatCountLabel(visibleTables.length, t.table, t.tablesCount, language)}
          </div>
          <select
            value={selectedFloor}
            onChange={(event) => setSelectedFloor(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
          >
            <option value="ALL">All floors</option>
            {floorNames.map((floorName) => (
              <option key={floorName} value={floorName}>
                {floorName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="relative min-h-[720px] overflow-auto rounded-[34px] border border-white/70 bg-[radial-gradient(circle,_rgba(220,184,160,0.45)_1px,_transparent_1px)] [background-size:32px_32px] p-6">
          <div className="absolute inset-x-6 bottom-6 flex items-center justify-between rounded-[24px] border border-white/70 bg-white/85 px-5 py-4 shadow-lg backdrop-blur">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
              <span className="uppercase tracking-[0.22em] text-slate-400">{t.legend}</span>
              <span className="rounded-xl bg-emerald-500 px-3 py-1 text-white">{t.available}</span>
              <span className="rounded-xl bg-[#a73308] px-3 py-1 text-white">{t.activeOrders}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((current) => Math.min(1.8, Number((current + 0.1).toFixed(2))))}
                className="rounded-full border border-slate-200 bg-white p-3"
              >
                <ZoomIn size={18} />
              </button>
              <button
                type="button"
                onClick={() => setZoom((current) => Math.max(0.7, Number((current - 0.1).toFixed(2))))}
                className="rounded-full border border-slate-200 bg-white p-3"
              >
                <ZoomOut size={18} />
              </button>
            </div>
          </div>

          <div
            ref={mapRef}
            className="relative min-h-[640px] origin-top-left transition-transform duration-200"
            style={{
              width: `${Math.max(100, Math.round(zoom * 100))}%`,
              height: `${Math.max(100, Math.round(zoom * 100))}%`,
              transform: `scale(${zoom})`,
            }}
            onPointerMove={(event) => handlePointerMove(event.clientX, event.clientY)}
            onPointerUp={() => void handlePointerUp()}
            onPointerLeave={() => void handlePointerUp()}
          >
            {visibleTables.map((table) => {
              const active = table.id === (selectedTableId || activeTable?.id);
              const position = resolvePosition(table.id, table.x, table.y);
              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => {
                    if (draggingTableId) {
                      return;
                    }
                    selectTable(table.id);
                  }}
                  onPointerDown={(event) => {
                    if (!moveMode || table.id !== activeTable?.id) {
                      return;
                    }

                    event.preventDefault();
                    selectTable(table.id);
                    setDraggingTableId(table.id);
                    handlePointerMove(event.clientX, event.clientY);
                  }}
                  className={[
                    'absolute flex items-center justify-center shadow-xl transition hover:scale-105',
                    table.shape === 'round' ? 'h-24 w-24 rounded-full' : 'h-24 w-24 rounded-[28px]',
                    tableTone[table.status],
                    active ? 'ring-4 ring-[#a73308]/30 ring-offset-4' : '',
                    moveMode && table.id === activeTable?.id ? 'cursor-grab ring-4 ring-sky-300 ring-offset-4' : '',
                    draggingTableId === table.id ? 'cursor-grabbing scale-105' : '',
                  ].join(' ')}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="text-center">
                    <p className="text-xl font-bold">{table.label}</p>
                    <p className="text-xs opacity-85">
                      {table.orderCount > 0
                        ? formatCountLabel(table.orderCount, t.ticket, t.tickets, language)
                        : formatCountLabel(table.seats, t.seat, t.seats, language)}
                    </p>
                    <p className="text-[10px] opacity-80">{table.floorName}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {activeTable ? (
          <section className="space-y-5">
            <div className="rounded-[30px] border border-white/70 bg-white/80 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {activeTable.floorName} - {activeTable.area}
                  </p>
                  <h3 className="mt-2 text-3xl font-bold">
                    {t.table} {activeTable.label}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatCountLabel(activeTable.orderCount, t.ticket, t.activeTickets, language)} -{' '}
                    {formatCountLabel(activeTable.seats, t.seat, t.seats, language)}
                  </p>
                </div>
                <span className="rounded-full bg-[#eaf2fb] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#39506b]">
                  {localizeTableStatus(activeTable.status, language)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    selectTable(activeTable.id);
                    setMoveMode((current) => !current);
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    moveMode
                      ? 'bg-sky-100 text-sky-700'
                      : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {savingLayoutId === activeTable.id ? `${moveButtonLabel}...` : moveButtonLabel}
                </button>
                {moveMode ? (
                  <p className="self-center text-xs text-slate-500">
                    {language === 'ar'
                      ? 'اسحب الطاولة داخل المخطط وسيتم حفظ مكانها تلقائيًا.'
                      : language === 'fr'
                        ? 'Glissez la table sur le plan. La position sera enregistree automatiquement.'
                        : 'Drag the table on the map. Its position will be saved automatically.'}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/70 bg-white/80 p-6">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-bold">{t.activeTicketsAtTable}</h4>
                <button
                  type="button"
                  onClick={() => startTableCompose(activeTable.id, Number(activeTable.label))}
                  className="inline-flex items-center gap-2 rounded-full bg-[#18222f] px-4 py-2 text-xs font-bold text-white"
                >
                  <Plus size={14} />
                  {t.newTicket}
                </button>
              </div>
              {activeTable.activeOrders.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{t.noTableOrders}</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {activeTable.activeOrders.map((orderSummary) => {
                    const fullOrder = activeTableOrders.find((entry) => entry.id === orderSummary.orderId);

                    return (
                    <article
                      key={orderSummary.orderId}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">#{orderSummary.shortId}</p>
                          <p className="mt-1 font-semibold text-[#a73308]">{orderSummary.guestLabel}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {orderSummary.status === 'DELIVERED'
                              ? t.readyToPay
                              : localizeUiStatus(orderSummary.status, language)}{' '}
                            - {formatCountLabel(orderSummary.itemCount, t.item, t.items, language)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatMoney(orderSummary.grandTotal)}</p>
                          <p className="text-xs text-slate-500">
                            Paid {formatMoney(orderSummary.paidAmount)} · Remaining {formatMoney(orderSummary.remainingAmount)}
                          </p>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">
                            {orderSummary.financialStatus}
                          </p>
                        </div>
                      </div>
                      {fullOrder ? (
                        <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                            {language === 'ar'
                              ? 'تفاصيل الطلب'
                              : language === 'fr'
                                ? 'Details de la commande'
                                : 'Order details'}
                          </p>
                          <div className="mt-3 space-y-2">
                            {fullOrder.items.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {item.quantity}x {item.menuItem ? localizeMenuItemName(item.menuItem, language) : item.menuItemId}
                                    </p>
                                    {item.notes ? (
                                      <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                                    ) : null}
                                    {item.modifiers?.length ? (
                                      <p className="mt-1 text-xs text-slate-500">
                                        {item.modifiers.map((modifier) => modifier.optionName).join(' • ')}
                                      </p>
                                    ) : null}
                                  </div>
                                  <p className="text-sm font-bold text-slate-700">
                                    {formatMoney(item.price * item.quantity)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            selectOrder(orderSummary.orderId);
                            setActiveScreen('order-detail');
                          }}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          {t.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => openCheckout({ type: 'order', orderId: orderSummary.orderId })}
                          className="flex-1 rounded-xl bg-[#a73308] px-3 py-2 text-sm font-semibold text-white"
                        >
                          {t.pay}
                        </button>
                      </div>
                    </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[30px] border border-white/70 bg-white/80 p-6">
              <h4 className="text-lg font-bold">{t.tableTotal}</h4>
              <div className="mt-4 flex justify-between text-lg font-bold">
                <span>{t.total}</span>
                <span className="text-[#a73308]">{formatMoney(totals.total)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-slate-500">
                <span>Paid</span>
                <span>{formatMoney(activeTable.paidAmount)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm text-slate-500">
                <span>Grand Total</span>
                <span>{formatMoney(activeTable.grandTotalAmount)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => startTableCompose(activeTable.id, Number(activeTable.label))}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"
                >
                  <Plus size={16} />
                  {t.edit}
                </button>
                {activeTable.activeOrders.length ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const billing = await getTableBilling(activeTable.id);
                      setTableBilling(billing);
                      setActiveScreen('table-billing');
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#a73308] px-4 py-3 text-sm font-bold text-white"
                  >
                    <CreditCard size={16} />
                    {t.pay}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400"
                  >
                    {t.pay}
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
