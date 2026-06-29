'use client';

import { memo } from 'react';
import { CreditCard, Minus, MoveRight, Plus, Send, Trash2 } from 'lucide-react';
import type { OrderResponse, TableDTO } from '@repo/shared-types';
import type { DraftLine, WaiterLanguage } from '@/store/waiter.store';
import { formatElapsedMinutes, formatMoney, formatTime } from '@/lib/format';
import {
  localizeDraftLineName,
  localizeDraftModifierName,
  localizeMenuItemName,
  localizeOrderStatus,
  localizeTableLabel,
  waiterT,
} from '@/lib/i18n';

type WaiterDraftPanelProps = {
  selectedTable: TableDTO | null;
  draftLines: DraftLine[];
  kitchenOrder: OrderResponse | null;
  currentTableOrders: OrderResponse[];
  previewOrder: OrderResponse | null;
  tableOrders: OrderResponse[];
  language: WaiterLanguage;
  isRtl: boolean;
  subtotal: number;
  tax: number;
  total: number;
  canEditPrimaryOrder: boolean;
  shouldCreateAdditionalOrder: boolean;
  busyAction: 'sending' | 'delivered' | 'paid' | null;
  canSettlePayment: boolean;
  editableOrder: OrderResponse | null;
  selectedEditableOrderId: string | null;
  onEditPendingOrder: (order: OrderResponse) => void;
  onRemoveDraftLine: (cartLineId: string) => void;
  onIncrementDraftLine: (cartLineId: string) => void;
  onDecrementDraftLine: (cartLineId: string) => void;
  onUpdateDraftLineNotes: (cartLineId: string, notes: string) => void;
  onSendToKitchen: () => void;
  onCancelEditableOrder: () => void;
  onDelivered: () => void;
  onPayNow: () => void;
};

function WaiterDraftPanelComponent(props: WaiterDraftPanelProps) {
  const {
    selectedTable,
    draftLines,
    kitchenOrder,
    currentTableOrders,
    previewOrder,
    tableOrders,
    language,
    isRtl,
    subtotal,
    tax,
    total,
    canEditPrimaryOrder,
    shouldCreateAdditionalOrder,
    busyAction,
    canSettlePayment,
    editableOrder,
    selectedEditableOrderId,
    onEditPendingOrder,
    onRemoveDraftLine,
    onIncrementDraftLine,
    onDecrementDraftLine,
    onUpdateDraftLineNotes,
    onSendToKitchen,
    onCancelEditableOrder,
    onDelivered,
    onPayNow,
  } = props;

  const t = waiterT(language);

  return (
    <aside className="flex w-full flex-col border-t border-[#ead4c2] bg-white/82 px-4 py-4 backdrop-blur md:px-5 md:py-5 2xl:max-w-[420px] 2xl:border-t-0 2xl:border-l">
      <div className="rounded-[28px] border border-[#edd9ca] bg-white px-5 py-5 shadow-[0_18px_45px_rgba(116,58,28,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b55229]">
              {t.currentTicket}
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {kitchenOrder ? `#${kitchenOrder.displayOrderId ?? kitchenOrder.dailyOrderNumber}` : t.localDraft}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {selectedTable ? localizeTableLabel(selectedTable.number, language) : t.selectTable}
            </p>
          </div>
          <div className={`rounded-[18px] bg-[#fff4ec] px-3 py-2 ${isRtl ? 'text-left' : 'text-right'}`}>
            <p className="text-xs font-semibold text-slate-500">{t.orderStatus}</p>
            <p className="mt-1 text-sm font-bold text-[#8d2d0e]">
              {kitchenOrder ? localizeOrderStatus(kitchenOrder.status, language) : t.localDraft}
            </p>
          </div>
        </div>
      </div>

      {false ? (
        <div className="mt-5 rounded-[28px] border border-[#ead7c8] bg-[#fffaf6] px-5 py-5 shadow-[0_16px_45px_rgba(116,58,28,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b55229]">
            {t.kitchenPipeline}
          </p>
          {previewOrder ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-[20px] bg-white px-4 py-3">
                <p className="text-xs text-slate-500">{t.orderStatus}</p>
                <p className="mt-1 text-lg font-black text-slate-950">
                  {localizeOrderStatus(previewOrder!.status, language)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">{t.createdAtLabel}</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {formatTime(previewOrder!.serviceTimes.createdAt, language)}
                  </p>
                </div>
                <div className="rounded-[18px] bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">{t.preparingAtLabel}</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {previewOrder!.serviceTimes.preparationStartedAt
                      ? formatTime(previewOrder!.serviceTimes.preparationStartedAt!, language)
                      : '--:--'}
                  </p>
                </div>
                <div className="rounded-[18px] bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">{t.readyAtLabel}</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {previewOrder!.serviceTimes.readyAt
                      ? formatTime(previewOrder!.serviceTimes.readyAt!, language)
                      : '--:--'}
                  </p>
                </div>
                <div className="rounded-[18px] bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">{t.deliveredAtLabel}</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {previewOrder!.serviceTimes.deliveredAt
                      ? formatTime(previewOrder!.serviceTimes.deliveredAt!, language)
                      : '--:--'}
                  </p>
                </div>
              </div>
              <div className="rounded-[20px] bg-white px-4 py-3">
                <p className="text-xs text-slate-500">{t.items}</p>
                <div className="mt-2 space-y-2">
                  {previewOrder!.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {item.quantity} ×{' '}
                          {item.menuItem
                            ? localizeMenuItemName(item.menuItem, language)
                            : item.menuItemId}
                        </p>
                        {item.notes ? (
                          <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                        ) : null}
                      </div>
                      <p className="font-bold text-slate-950">
                        {formatMoney(item.price * item.quantity, language)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {formatElapsedMinutes(previewOrder!.createdAt, language)}
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-[20px] bg-white px-4 py-4 text-sm text-slate-500">
              {t.addItemsToStart}
            </div>
          )}
        </div>
      ) : null}

      {shouldCreateAdditionalOrder ? (
        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t.originalOrderLocked}
        </div>
      ) : null}

      {currentTableOrders.length > 0 ? (
        <div className="mt-5 rounded-[28px] border border-[#ead7c8] bg-white px-5 py-5 shadow-[0_16px_45px_rgba(116,58,28,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b55229]">
            {t.currentTicket}
          </p>
          <div className="mt-4 space-y-3">
            {currentTableOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onEditPendingOrder(order)}
                className={`w-full rounded-[20px] px-4 py-4 text-left ${
                  order.status === 'PENDING'
                    ? 'bg-[#fff3ea] ring-1 ring-[#cf835f] transition hover:bg-[#ffe8d7]'
                    : 'cursor-default bg-[#fffaf6]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">#{order.displayOrderId ?? order.dailyOrderNumber}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {localizeOrderStatus(order.status, language)}
                    </p>
                    {order.status === 'PENDING' ? (
                      <p className="mt-1 text-xs font-semibold text-[#8d2d0e]">
                        {selectedEditableOrderId === order.id
                          ? `${t.updateKitchenTicket} • Active`
                          : t.updateKitchenTicket}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm font-bold text-[#8d2d0e]">
                    {formatMoney(order.grandTotal ?? 0, language)}
                  </p>
                </div>
                <div className="mt-3 space-y-2">
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {item.quantity} ×{' '}
                          {item.menuItem
                            ? localizeMenuItemName(item.menuItem, language)
                            : item.menuItemId}
                        </p>
                        {item.notes ? (
                          <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                        ) : null}
                      </div>
                      <p className="font-bold text-slate-950">
                        {formatMoney(item.price * item.quantity, language)}
                      </p>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {false ? (
        <div className="mt-5 rounded-[28px] border border-[#ead7c8] bg-white px-5 py-5 shadow-[0_16px_45px_rgba(116,58,28,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b55229]">
            {t.orderTimeline}
          </p>
          <div className="mt-4 space-y-3">
            {tableOrders.map((order) => (
              <div key={order.id} className="rounded-[22px] border border-[#efdfd2] bg-[#fffaf6] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {order.parentOrderId ? t.additionalOrders : t.primaryOrder} #{order.displayOrderId ?? order.dailyOrderNumber}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {localizeOrderStatus(order.status, language)} · {formatElapsedMinutes(order.createdAt, language)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#8d2d0e]">
                    {formatMoney(order.grandTotal ?? 0, language)}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <span>{t.createdAtLabel}: {formatTime(order.serviceTimes.createdAt, language)}</span>
                  <span>{t.acceptedAtLabel}: {order.serviceTimes.acceptedAt ? formatTime(order.serviceTimes.acceptedAt, language) : '--:--'}</span>
                  <span>{t.preparingAtLabel}: {order.serviceTimes.preparationStartedAt ? formatTime(order.serviceTimes.preparationStartedAt, language) : '--:--'}</span>
                  <span>{t.readyAtLabel}: {order.serviceTimes.readyAt ? formatTime(order.serviceTimes.readyAt, language) : '--:--'}</span>
                  <span>{t.deliveredAtLabel}: {order.serviceTimes.deliveredAt ? formatTime(order.serviceTimes.deliveredAt, language) : '--:--'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-1">
        {draftLines.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#dcc6b5] bg-[#fff9f4] px-5 py-10 text-center text-sm text-slate-500">
            {t.addItemsToStart}
          </div>
        ) : (
          draftLines.map((line) => (
            <div
              key={line.cartLineId}
              className="rounded-[24px] border border-[#ead7c8] bg-white px-4 py-4 shadow-[0_12px_28px_rgba(116,58,28,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    {localizeDraftLineName(line, language)}
                  </h3>
                  {line.modifierDetails.length ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {line.modifierDetails
                        .map((modifier) => localizeDraftModifierName(modifier, language))
                        .join(' | ')}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveDraftLine(line.cartLineId)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-full border border-[#e8d1be] bg-[#fff8f2]">
                  <button
                    type="button"
                    onClick={() => onDecrementDraftLine(line.cartLineId)}
                    className="p-3 text-[#8d2d0e]"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-10 text-center text-sm font-bold text-slate-900">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onIncrementDraftLine(line.cartLineId)}
                    className="p-3 text-[#8d2d0e]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-950">
                  {formatMoney(line.unitPrice * line.quantity, language)}
                </p>
              </div>

              <textarea
                value={line.notes ?? ''}
                onChange={(event) => onUpdateDraftLineNotes(line.cartLineId, event.target.value)}
                rows={2}
                placeholder={t.kitchenNote}
                className="mt-4 w-full rounded-[18px] border border-[#ead7c8] bg-[#fffdfa] px-3 py-2 text-sm outline-none focus:border-[#cf835f]"
              />
            </div>
          ))
        )}
      </div>

      <div className="mt-5 rounded-[28px] border border-[#ead7c8] bg-[#fcf8f3] px-5 py-5 shadow-[0_16px_45px_rgba(116,58,28,0.08)]">
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>{t.subtotal}</span>
            <span>{formatMoney(subtotal, language)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t.tax}</span>
            <span>{formatMoney(tax, language)}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-dashed border-[#d9c2af] pt-4">
          <span className="text-lg font-bold text-slate-950">{t.total}</span>
          <span className="text-3xl font-black text-[#8d2d0e]">{formatMoney(total, language)}</span>
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={onSendToKitchen}
            disabled={!selectedTable || busyAction !== null}
            className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-[20px] bg-[#8d2d0e] text-base font-bold text-white shadow-[0_18px_28px_rgba(141,45,14,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            {busyAction === 'sending'
              ? t.savingTicket
              : canEditPrimaryOrder
                ? t.updateKitchenTicket
                : t.sendToKitchen}
          </button>

          <div className={`grid gap-3 ${canSettlePayment ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <button
              type="button"
              onClick={onCancelEditableOrder}
              disabled={!editableOrder || busyAction !== null}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-rose-50 font-semibold text-rose-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={onDelivered}
              disabled={!kitchenOrder || kitchenOrder.status !== 'READY' || busyAction !== null}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[#eefaf3] font-semibold text-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MoveRight className="h-4 w-4" />
              {busyAction === 'delivered' ? t.updating : t.markDelivered}
            </button>
            {canSettlePayment ? (
              <button
                type="button"
                onClick={onPayNow}
                disabled={!kitchenOrder || kitchenOrder.status !== 'DELIVERED' || busyAction !== null}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[#fff0f1] font-semibold text-rose-700 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                {busyAction === 'paid' ? t.processing : t.payNow}
              </button>
            ) : null}
          </div>
        </div>

      </div>
    </aside>
  );
}

export const WaiterDraftPanel = memo(WaiterDraftPanelComponent);
