'use client';

import { OrderComposeScreen } from '@/components/pos/order-compose-screen';
import { CheckoutScreen } from '@/components/pos/checkout-screen';
import { OrderDetailScreen } from '@/components/pos/order-detail-screen';
import { OrdersScreen } from '@/components/pos/orders-screen';
import { OrdersHistoryScreen } from '@/components/pos/orders-history-screen';
import { PosShell } from '@/components/pos/pos-shell';
import { ReceiptScreen } from '@/components/pos/receipt-screen';
import { TablesScreen } from '@/components/pos/tables-screen';
import { TableBillingScreen } from '@/components/pos/table-billing-screen';
import {
  computeOrderTotal,
  findTicket,
  usePosActivityFeed,
  usePosOrdersView,
} from '@/hooks/use-pos-selectors';
import { formatMoney } from '@/lib/format';
import { getLiveActivityFallback, getPosScreenCopy, posT } from '@/lib/i18n';
import { usePosDataStore } from '@/store/pos-data.store';
import { usePosUiStore } from '@/store/pos-ui.store';

export function PosApp() {
  const activeScreen = usePosUiStore((state) => state.activeScreen);
  const language = usePosUiStore((state) => state.language);
  const selectedOrderId = usePosUiStore((state) => state.selectedOrderId);
  const settings = usePosDataStore((state) => state.settings);
  const tickets = usePosOrdersView();
  const activity = usePosActivityFeed();
  const selectedOrder = findTicket(tickets, selectedOrderId);
  const totals = selectedOrder ? computeOrderTotal(selectedOrder.grandTotal) : null;
  const t = posT(language);
  const restaurantName = settings?.restaurantName?.trim() || t.posHub;
  const copy = getPosScreenCopy(language)[activeScreen];
  const feed = activity.length > 0 ? activity : getLiveActivityFallback(language);

  return (
    <PosShell
      title={copy.title}
      subtitle={`${restaurantName} - ${copy.subtitle}`}
      hideRightRail={activeScreen === 'tables'}
      rightRail={
        selectedOrder && totals ? (
          <div className="flex h-full flex-col">
            <div className="rounded-[28px] border border-white/70 bg-white/80 p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#fff0e8] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#8d3c19]">
                  #{selectedOrder.displayId}
                </span>
                <span className="text-sm text-slate-500">{selectedOrder.openedAt}</span>
              </div>
              <h3 className="mt-4 text-2xl font-bold">{selectedOrder.table}</h3>
              <p className="mt-1 text-sm text-slate-500">{selectedOrder.guestName}</p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedOrder.itemCount} {t.items} - {selectedOrder.guestCount} {t.qty}
              </p>
              <div className="mt-5 flex justify-between border-t border-dashed border-slate-200 pt-3 text-lg font-bold">
                <span>{t.total}</span>
                <span className="text-[#a73308]">{formatMoney(totals.total)}</span>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/70 bg-white/80 p-5">
              <h4 className="text-lg font-bold">{t.liveActivity}</h4>
              <div className="mt-4 space-y-4">
                {feed.slice(0, 3).map((item) => (
                  <div key={item.id} className="border-l-2 border-[#cf6d43] pl-4">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      {item.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 text-sm text-slate-500">
            {t.selectTicketHint}
          </div>
        )
      }
    >
      {activeScreen === 'orders' ? <OrdersScreen /> : null}
      {activeScreen === 'tables' ? <TablesScreen /> : null}
      {activeScreen === 'table-billing' ? <TableBillingScreen /> : null}
      {activeScreen === 'external-orders' ? <OrderComposeScreen /> : null}
      {activeScreen === 'orders-history' ? <OrdersHistoryScreen /> : null}
      {activeScreen === 'order-compose' ? <OrderComposeScreen /> : null}
      {activeScreen === 'order-detail' ? <OrderDetailScreen /> : null}
      {activeScreen === 'checkout' ? <CheckoutScreen /> : null}
      {activeScreen === 'receipt' ? <ReceiptScreen /> : null}
    </PosShell>
  );
}
