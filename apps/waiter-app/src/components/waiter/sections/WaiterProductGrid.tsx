'use client';

import { memo } from 'react';
import { Plus } from 'lucide-react';
import type { MenuDTO, MenuItemDTO, OrderResponse, TableDTO } from '@repo/shared-types';
import type { WaiterLanguage } from '@/store/waiter.store';
import { formatMoney } from '@/lib/format';
import {
  formatCountLabel,
  localizeMenuItemBadge,
  localizeMenuItemDescription,
  localizeMenuItemName,
  localizeMenuName,
  localizeTableLabel,
  waiterT,
} from '@/lib/i18n';

type WaiterProductGridProps = {
  selectedTable: TableDTO | null;
  activeMenuId: string | null;
  menus: MenuDTO[];
  visibleMenuItems: MenuItemDTO[];
  feedback: string | null;
  actionError: string | null;
  kitchenOrder: OrderResponse | null;
  language: WaiterLanguage;
  onSetActiveMenuId: (menuId: string | null) => void;
  onQuickAdd: (item: MenuItemDTO) => void;
};

function WaiterProductGridComponent(props: WaiterProductGridProps) {
  const {
    selectedTable,
    activeMenuId,
    menus,
    visibleMenuItems,
    feedback,
    actionError,
    kitchenOrder,
    language,
    onSetActiveMenuId,
    onQuickAdd,
  } = props;

  const t = waiterT(language);

  return (
    <section className="flex min-w-0 flex-1 flex-col px-4 py-4 md:px-5 md:py-5">
      <div className="rounded-[28px] border border-[#ecd8c7] bg-white px-5 py-4 shadow-[0_18px_45px_rgba(116,58,28,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-[22px] bg-[#8d2d0e] px-4 py-3 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                {t.activeService}
              </p>
              <p className="mt-1 text-lg font-bold">
                {selectedTable ? localizeTableLabel(selectedTable.number, language) : t.selectTable}
              </p>
            </div>
            <div className="rounded-[22px] bg-[#fff6ef] px-4 py-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">
                {kitchenOrder ? `#${kitchenOrder.displayOrderId ?? kitchenOrder.dailyOrderNumber}` : t.newTicketDraft}
              </p>
              <p className="mt-1">
                {selectedTable
                  ? formatCountLabel(selectedTable.capacity, t.seat, t.seats, language)
                  : t.selectTable}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onSetActiveMenuId(null)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              activeMenuId === null
                ? 'bg-[#8d2d0e] text-white'
                : 'bg-[#f4ede7] text-slate-700 hover:bg-[#eedfce]'
            }`}
          >
            {t.allMenu}
          </button>
          {menus.map((menu) => (
            <button
              key={menu.id}
              type="button"
              onClick={() => onSetActiveMenuId(menu.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                activeMenuId === menu.id
                  ? 'bg-[#8d2d0e] text-white'
                  : 'bg-[#f4ede7] text-slate-700 hover:bg-[#eedfce]'
              }`}
            >
              {localizeMenuName(menu, language)}
            </button>
          ))}
        </div>
      </div>

      {feedback ? (
        <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {actionError}
        </div>
      ) : null}

      <div className="mt-5 grid flex-1 grid-cols-1 gap-4 overflow-y-auto pb-5 sm:grid-cols-2 2xl:grid-cols-3">
        {visibleMenuItems.map((item) => {
          const itemBadge = localizeMenuItemBadge(item, language);
          const itemName = localizeMenuItemName(item, language);
          const itemDescription = localizeMenuItemDescription(item, language) ?? t.noDescription;

          return (
            <article
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-[28px] border border-[#ead7c8] bg-white shadow-[0_18px_45px_rgba(116,58,28,0.08)] transition hover:-translate-y-1 hover:border-[#cf835f]"
            >
              <div className="relative h-44 bg-[linear-gradient(135deg,#41251b,#8d2d0e)]">
                {item.image ? (
                  <img src={item.image} alt={itemName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-end p-5">
                    <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                      {t.chefChoice}
                    </div>
                  </div>
                )}
                <div className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1 text-sm font-bold text-white backdrop-blur">
                  {formatMoney(item.price, language)}
                </div>
                {itemBadge ? (
                  <div className="absolute left-4 top-4 rounded-full bg-[#fff2a9] px-3 py-1 text-xs font-bold text-[#6d4c00]">
                    {itemBadge}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">{itemName}</h3>
                    <p className="mt-2 text-sm text-slate-500">{itemDescription}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.modifierGroups?.length ? (
                    <span className="rounded-full bg-[#f3f5f8] px-3 py-1 text-xs font-semibold text-slate-600">
                      {t.customizable}
                    </span>
                  ) : null}
                  {item.featured ? (
                    <span className="rounded-full bg-[#fff0e8] px-3 py-1 text-xs font-semibold text-[#a84b20]">
                      {t.featured}
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => onQuickAdd(item)}
                  disabled={!selectedTable}
                  className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[#f4ebe5] font-semibold text-[#8d2d0e] transition hover:bg-[#8d2d0e] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" />
                  {item.modifierGroups?.length ? t.customize : t.quickAdd}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export const WaiterProductGrid = memo(WaiterProductGridComponent);
