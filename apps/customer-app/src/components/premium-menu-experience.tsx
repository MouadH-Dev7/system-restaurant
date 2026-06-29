'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  ChefHat,
  ChevronDown,
  Clock3,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
} from 'lucide-react';
import type { OrderResponse } from '@repo/shared-types';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error';
import { getOrCreateGuestSessionId } from '@/lib/guest-session';
import { localizeDescription, localizeName, t } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import { getStatusHeadline } from '@/lib/order-status';
import { routes } from '@/lib/routes';
import { createOrder, updateCustomerOrder } from '@/services/order.service';
import { callWaiter } from '@/services/table.service';
import { useAppStore } from '@/store/app.store';
import { getCartLines, getCartTotal, getDraftItems, useCartStore } from '@/store/cart.store';
import { useGuestOrdersStore } from '@/store/guest-orders.store';
import { useLanguageStore } from '@/store/language.store';
import type { Language, Menu, MenuItem } from '@/types/menu';
import type { CreateOrderInput, OrderContextDTO } from '@/types/order';
import { TableSessionSync } from './table-session-sync';
import {
  resolveTheme,
  defaultSelectionForItem,
  validateCustomization,
  CustomizationModal,
  FoodCard,
  ModalShell,
  WaiterCallButton,
  WaiterComingBanner,
} from './menu-sections';
import { CartDrawer } from './cart-sections';
import type {
  ThemeConfig,
  CustomizerState,
} from './menu-sections';

type PremiumMenuExperienceProps = {
  initialContext: OrderContextDTO | null;
  menus: Menu[];
  menuItems: MenuItem[];
  loading: boolean;
  failed: boolean;
};

export function PremiumMenuExperience({
  initialContext,
  menus,
  menuItems,
  loading,
  failed,
}: PremiumMenuExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const language = useLanguageStore((state) => state.language);
  const storedContext = useAppStore((state) => state.context);
  const setOrderContext = useAppStore((state) => state.setOrderContext);
  const waiterComingMessage = useAppStore((state) => state.waiterComingMessage);
  const setWaiterComingMessage = useAppStore((state) => state.setWaiterComingMessage);
  const draft = useCartStore((state) => state.draft);
  const editingOrderId = useCartStore((state) => state.editingOrderId);
  const editingOrderNumber = useCartStore((state) => state.editingOrderNumber);
  const editingOrderVersion = useCartStore((state) => state.editingOrderVersion);
  const addItem = useCartStore((state) => state.addItem);
  const addConfiguredItem = useCartStore((state) => state.addConfiguredItem);
  const clearCart = useCartStore((state) => state.clear);
  const orders = useGuestOrdersStore((state) => state.orders);
  const copy = t(language);
  const context = initialContext ?? storedContext;
  const requestedMenuId = searchParams.get('menuId');
  const requestedPanel = searchParams.get('panel');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(requestedMenuId);
  const [customizing, setCustomizing] = useState<CustomizerState | null>(null);
  const [customizationError, setCustomizationError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [latestCreatedOrderId, setLatestCreatedOrderId] = useState<string | null>(null);
  const [callingWaiter, setCallingWaiter] = useState(false);

  useEffect(() => {
    if (context) {
      setOrderContext(context);
    }
  }, [context, setOrderContext]);

  useEffect(() => {
    if (!menus.length) {
      return;
    }

    const nextActiveId =
      (requestedMenuId && menus.some((menu) => menu.id === requestedMenuId) ? requestedMenuId : null) ??
      activeMenuId ??
      menus[0]?.id ??
      null;

    if (nextActiveId !== activeMenuId) {
      setActiveMenuId(nextActiveId);
    }
  }, [activeMenuId, menus, requestedMenuId]);

  useEffect(() => {
    if (requestedPanel === 'cart') {
      setCartOpen(true);
      setConfirmOpen(false);
      return;
    }

    if (requestedPanel === 'checkout') {
      setCartOpen(false);
      setConfirmOpen(true);
      return;
    }

    setCartOpen(false);
    setConfirmOpen(false);
  }, [requestedPanel]);

  const activeMenu = useMemo(
    () => menus.find((menu) => menu.id === activeMenuId) ?? menus[0] ?? null,
    [activeMenuId, menus],
  );

  const activeItems = useMemo(
    () =>
      menuItems
        .filter((item) => item.menuId === activeMenu?.id && item.available)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    [activeMenu?.id, menuItems],
  );

  const featuredItems = useMemo(
    () => menuItems.filter((item) => item.available && item.featured).slice(0, 6),
    [menuItems],
  );

  const draftItems = getDraftItems(draft, context);
  const cartLines = getCartLines(draftItems, menuItems);
  const cartCount = draftItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = getCartTotal(cartLines);
  const activeTheme = resolveTheme(activeMenu);
  const heroImage = activeMenu?.heroImage ?? activeMenu?.image ?? activeTheme.heroFallback;
  const latestActiveOrder = orders[orders.length - 1] ?? null;
  const highlightedOrder =
    orders.find((order) => order.id === latestCreatedOrderId) ?? latestActiveOrder ?? null;
  const recentOrders = orders.slice().reverse().slice(0, 6);

  function replaceParams(update: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    update(next);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function selectMenu(menuId: string) {
    setActiveMenuId(menuId);
    replaceParams((params) => {
      params.set('menuId', menuId);
    });
  }

  function setPanel(panel: 'cart' | 'checkout' | null) {
    replaceParams((params) => {
      if (panel) {
        params.set('panel', panel);
      } else {
        params.delete('panel');
      }
    });
  }

  function openItem(item: MenuItem) {
    if (!context) {
      return;
    }

    if (!item.modifierGroups?.length) {
      addItem(item, context);
      setPanel('cart');
      return;
    }

    setCustomizationError(null);
    setCustomizing({
      item,
      quantity: 1,
      notes: '',
      selectedOptionIds: defaultSelectionForItem(item),
    });
  }

  async function handleCallWaiter() {
    if (!context || callingWaiter) {
      return;
    }

    setCallingWaiter(true);
    try {
      await callWaiter(context);
      setWaiterComingMessage(copy.waiterCalled);
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 409) {
        setWaiterComingMessage(copy.waiterCallAlreadyOpen);
      }
    } finally {
      setCallingWaiter(false);
    }
  }

  function confirmCustomization() {
    if (!customizing || !context) {
      return;
    }

    const error = validateCustomization(customizing.item, customizing.selectedOptionIds, language);
    if (error) {
      setCustomizationError(error);
      return;
    }

    addConfiguredItem({
      menuItem: customizing.item,
      context,
      quantity: customizing.quantity,
      notes: customizing.notes,
      modifierOptionIds: customizing.selectedOptionIds,
    });

    setCustomizationError(null);
    setCustomizing(null);
    setPanel('cart');
  }

  function buildOrderInput(): CreateOrderInput | null {
    if (!context || draftItems.length === 0) {
      return null;
    }

    return {
      restaurantId: context.restaurantId,
      tableId: context.tableId,
      guestSessionId: getOrCreateGuestSessionId(context),
      items: draftItems.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        cartLineId: item.cartLineId,
        modifierOptionIds: item.modifierOptionIds,
        ...(item.notes ? { notes: item.notes } : {}),
      })),
    };
  }

  async function submitOrder() {
    const input = buildOrderInput();
    if (!context || !input) {
      setSubmitError(copy.emptyCart);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let order: OrderResponse;
      if (editingOrderId) {
        if (editingOrderVersion === null) {
          setSubmitError(copy.orderUpdatedByStaff);
          return;
        }

        order = await updateCustomerOrder(
          editingOrderId,
          { items: input.items, version: editingOrderVersion },
          context,
          getOrCreateGuestSessionId(context),
        );
      } else {
        order = await createOrder(input);
      }
      useGuestOrdersStore.getState().upsertOrder(order);
      setLatestCreatedOrderId(order.id);
      clearCart();
      setPanel(null);
      router.push(routes.orderConfirmation(order.id, context));
    } catch (error) {
      const status = getApiErrorStatus(error);
      const apiMessage = getApiErrorMessage(error, '');

      if (status === 403) {
        setSubmitError(copy.invalidTableSession);
        return;
      }

      if (status === 409 && editingOrderId) {
        if (apiMessage.includes('preparation has already started')) {
          clearCart();
          setPanel(null);
          router.push(routes.orderConfirmation(editingOrderId, context));
          return;
        }

        setSubmitError(copy.orderUpdatedByStaff);
        return;
      }

      setSubmitError(
        getApiErrorMessage(error, editingOrderId ? copy.updateOrderFailed : copy.submitOrderFailed),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!context) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f2ea] px-6">
        <div className="max-w-md rounded-[28px] border border-[#d8c2a6] bg-white p-8 text-center shadow-[0_24px_70px_rgba(67,48,28,0.12)]">
          <h1 className="text-3xl font-semibold text-[#2d241d]">{copy.noTableContext}</h1>
          <p className="mt-3 text-sm text-[#74675b]">
            Open the customer menu using the table QR code so the session is attached correctly.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${activeTheme.page} ${activeTheme.ink}`}>
      <TableSessionSync context={context} />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <img
          src={heroImage}
          alt=""
          className="h-full w-full scale-105 object-cover opacity-30 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.45))]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <header
          className={`sticky top-3 z-30 rounded-full border px-3 py-2 ${activeTheme.panel} ${activeTheme.border} ${activeTheme.shadow}`}
        >
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="mr-2 flex shrink-0 items-center gap-3 px-2">
              <span
                className={`grid h-10 w-10 place-items-center rounded-full ${activeTheme.accent} ${activeTheme.accentText}`}
              >
                <Sparkles size={18} />
              </span>
              <div className="hidden sm:block">
                <p className="text-lg font-semibold">{copy.brand}</p>
                <p className={`text-xs ${activeTheme.muted}`}>{copy.currentOrder}</p>
              </div>
            </div>

            {menus.map((menu) => {
              const active = menu.id === activeMenu?.id;
              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => selectMenu(menu.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? `${activeTheme.accent} ${activeTheme.accentText}`
                      : `${activeTheme.panelSoft} ${activeTheme.border}`
                  }`}
                >
                  {localizeName(menu, language)}
                </button>
              );
            })}
          </div>
        </header>

        {editingOrderId && editingOrderNumber ? (
          <div
            className={`flex items-center justify-between gap-4 rounded-full border px-5 py-3 ${activeTheme.panel} ${activeTheme.border} ${activeTheme.shadow} bg-amber-500/10`}
          >
            <p className="text-sm font-semibold">
              {copy.editingOrderBanner.replace('{{number}}', String(editingOrderNumber))}
            </p>
            <button
              type="button"
              onClick={() => {
                clearCart();
                router.push(routes.orderConfirmation(editingOrderId, context));
              }}
              className="rounded-full bg-red-600 hover:bg-red-700 px-4 py-1.5 text-xs font-bold text-white transition shrink-0"
            >
              {copy.cancelEditing}
            </button>
          </div>
        ) : null}

        {waiterComingMessage ? (
          <WaiterComingBanner message={waiterComingMessage} theme={activeTheme} />
        ) : null}

        {recentOrders.length ? (
          <section className={`rounded-[30px] border p-5 ${activeTheme.panel} ${activeTheme.border} ${activeTheme.shadow}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.2em] ${activeTheme.muted}`}>
                  {copy.myOrders}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{copy.currentOrder}</h2>
                <p className={`mt-1 text-sm ${activeTheme.muted}`}>{copy.myOrdersHint}</p>
              </div>
              {context ? (
                <WaiterCallButton
                  onClick={() => void handleCallWaiter()}
                  callingWaiter={callingWaiter}
                  theme={activeTheme}
                  language={language}
                />
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={routes.orderConfirmation(order.id, context)}
                  className={`rounded-[22px] border px-4 py-4 transition ${activeTheme.panelSoft} ${activeTheme.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {copy.orderLabel} #{order.dailyOrderNumber}
                      </p>
                      <p className={`mt-1 text-sm ${activeTheme.muted}`}>{getStatusHeadline(order.status, language)}</p>
                    </div>
                    <p className="font-bold">{formatMoney(order.grandTotal)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid min-h-[360px] content-end gap-5 py-8">
          <div className="max-w-3xl">
            <div
              className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${activeTheme.panel} ${activeTheme.border}`}
            >
              <Clock3 size={15} />
              {copy.menusTitle}
            </div>
            <h1 className="text-5xl font-semibold leading-[0.95] sm:text-7xl">
              {localizeName(activeMenu, language) || copy.menusTitle}
            </h1>
            <p className={`mt-4 max-w-2xl text-base leading-7 sm:text-lg ${activeTheme.muted}`}>
              {localizeDescription(activeMenu, language) || copy.menusHint}
            </p>
          </div>

          <div
            className={`flex w-full max-w-xl items-center justify-between rounded-[28px] border px-5 py-4 ${activeTheme.panel} ${activeTheme.border}`}
          >
            <div>
              <p className="text-sm font-semibold">{copy.currentOrder}</p>
              <p className={`text-xs ${activeTheme.muted}`}>
                {cartCount ? `${cartCount} ${copy.selectedItems}` : copy.readyWhenYouAre}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <WaiterCallButton
                onClick={() => void handleCallWaiter()}
                callingWaiter={callingWaiter}
                theme={activeTheme}
                language={language}
              />
              <ChevronDown size={20} />
            </div>
          </div>
        </section>

        {highlightedOrder ? (
          <OrderTrackerCard order={highlightedOrder} theme={activeTheme} language={language} />
        ) : null}

        {loading ? (
          <section className={`rounded-[28px] border p-8 ${activeTheme.panel} ${activeTheme.border}`}>
            <p className={activeTheme.muted}>{copy.connecting}</p>
          </section>
        ) : null}

        {failed ? (
          <section className={`rounded-[28px] border p-8 ${activeTheme.panel} ${activeTheme.border}`}>
            <p className={activeTheme.muted}>{copy.menuLoadFailed}</p>
          </section>
        ) : null}

        {!loading && !failed ? (
          <>
            <section className="space-y-4">
              <SectionHeader
                title={localizeName(activeMenu, language) || copy.menusTitle}
                eyebrow={copy.itemsHint}
                icon={<ChefHat size={18} />}
                theme={activeTheme}
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeItems.map((item) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    language={language}
                    theme={activeTheme}
                    onAdd={() => openItem(item)}
                  />
                ))}
              </div>
              {!activeItems.length ? <p className={activeTheme.muted}>{copy.noMenuItems}</p> : null}
            </section>

            <HorizontalSection
              title={copy.suggestedForYou}
              items={featuredItems.length ? featuredItems : activeItems.slice(0, 6)}
              theme={activeTheme}
              language={language}
            />
          </>
        ) : null}

      </div>

      <button
        type="button"
        onClick={() => setPanel('cart')}
        className={`fixed bottom-5 right-5 z-40 flex min-h-16 items-center gap-2 rounded-full px-5 ${activeTheme.accent} ${activeTheme.accentText} ${activeTheme.shadow}`}
        aria-label={copy.viewCart}
      >
        <ShoppingBag size={20} />
        <span className="font-semibold">{cartCount}</span>
      </button>

      {customizing ? (
        <CustomizationModal
          state={customizing}
          setState={setCustomizing}
          error={customizationError}
          language={language}
          theme={activeTheme}
          onClose={() => {
            setCustomizationError(null);
            setCustomizing(null);
          }}
          onAdd={confirmCustomization}
        />
      ) : null}

      {cartOpen ? (
        <CartDrawer
          lines={cartLines}
          total={cartTotal}
          language={language}
          theme={activeTheme}
          onClose={() => setPanel(null)}
          onConfirm={() => {
            setSubmitError(null);
            setPanel('checkout');
          }}
        />
      ) : null}

      {confirmOpen ? (
        <ConfirmModal
          lines={cartLines}
          total={cartTotal}
          latestOrder={highlightedOrder}
          context={context}
          language={language}
          theme={activeTheme}
          error={submitError}
          submitting={submitting}
          onClose={() => setPanel(cartLines.length ? 'cart' : null)}
          onValidate={() => void submitOrder()}
        />
      ) : null}
    </main>
  );
}

function SectionHeader({
  title,
  eyebrow,
  icon,
  theme,
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  theme: ThemeConfig;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${theme.muted}`}>
          {icon}
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
      </div>
    </div>
  );
}

function HorizontalSection({
  title,
  items,
  theme,
  language,
}: {
  title: string;
  items: MenuItem[];
  theme: ThemeConfig;
  language: Language;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <SectionHeader title={title} eyebrow={t(language).chefRecommendations} icon={<Star size={16} />} theme={theme} />
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <article
            key={`${title}-${item.id}`}
            className={`w-72 shrink-0 overflow-hidden rounded-[24px] border ${theme.panel} ${theme.border}`}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={localizeName(item, language)}
                className="h-36 w-full object-cover"
              />
            ) : (
              <div className="flex h-36 items-center justify-center p-4 text-center font-semibold">
                {localizeName(item, language)}
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold">{localizeName(item, language)}</h3>
              <p className={`mt-1 text-sm ${theme.muted}`}>{formatMoney(item.price)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ConfirmModal({
  lines,
  total,
  latestOrder,
  context,
  language,
  theme,
  error,
  submitting,
  onClose,
  onValidate,
}: {
  lines: ReturnType<typeof getCartLines>;
  total: number;
  latestOrder: OrderResponse | null;
  context: OrderContextDTO | null;
  language: Language;
  theme: ThemeConfig;
  error: string | null;
  submitting: boolean;
  onClose: () => void;
  onValidate: () => void;
}) {
  const copy = t(language);
  const editingOrderId = useCartStore((state) => state.editingOrderId);

  return (
    <ModalShell theme={theme} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <span className={`grid h-12 w-12 place-items-center rounded-full ${theme.accent} ${theme.accentText}`}>
            <ReceiptText />
          </span>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.2em] ${theme.muted}`}>{copy.currentOrder}</p>
            <h2 className="text-3xl font-semibold">
              {editingOrderId ? copy.updateOrder : copy.confirmOrder}
            </h2>
          </div>
        </div>

        <div className="max-h-72 space-y-3 overflow-y-auto">
          {lines.map((line) => (
            <div
              key={line.cartLineId ?? line.menuItemId}
              className="flex justify-between gap-3 border-b border-white/15 pb-3"
            >
              <div>
                <p className="font-semibold">
                  {line.quantity} x {localizeName(line.menuItem, language)}
                </p>
                {line.selectedModifiers.length ? (
                  <p className={`text-xs ${theme.muted}`}>
                    {line.selectedModifiers.map((modifier) => localizeName(modifier, language)).join(' | ')}
                  </p>
                ) : null}
                {line.notes ? <p className={`text-xs ${theme.muted}`}>{line.notes}</p> : null}
              </div>
              <p className="font-bold">{formatMoney(line.lineTotal)}</p>
            </div>
          ))}
        </div>

        {latestOrder ? (
          <Link
            href={routes.orderConfirmation(latestOrder.id, context)}
            className={`block rounded-[20px] border px-4 py-3 text-sm ${theme.panelSoft} ${theme.border}`}
          >
            {copy.orderLabel} #{latestOrder.dailyOrderNumber}
          </Link>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center justify-between text-xl font-bold">
          <span>{copy.total}</span>
          <span>{formatMoney(total)}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border px-5 py-4 font-bold ${theme.panelSoft} ${theme.border}`}
          >
            {copy.continueBrowsing}
          </button>
          <button
            type="button"
            onClick={onValidate}
            disabled={submitting}
            className={`rounded-full px-5 py-4 font-bold ${theme.accent} ${theme.accentText} disabled:opacity-60`}
          >
            {submitting
              ? (editingOrderId ? copy.updatingOrder : copy.submittingOrder)
              : (editingOrderId ? copy.updateOrder : copy.submitOrder)}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function OrderTrackerCard({
  order,
  theme,
  language,
}: {
  order: OrderResponse;
  theme: ThemeConfig;
  language: Language;
}) {
  const copy = t(language);
  const steps = [copy.stepPending, copy.stepPreparing, copy.stepReady, copy.stepDelivered];
  const statuses = ['PENDING', 'PREPARING', 'READY', 'DELIVERED'] as const;
  const currentIndex = Math.max(0, statuses.findIndex((status) => status === order.status));

  return (
    <section className={`rounded-[28px] border p-5 ${theme.panel} ${theme.border} ${theme.shadow}`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${theme.muted}`}>{copy.liveTracking}</p>
          <h2 className="text-3xl font-semibold">
            {copy.orderLabel} #{order.dailyOrderNumber}
          </h2>
        </div>
        <Star />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, index) => {
          const done = index <= currentIndex;
          return (
            <div key={step} className="text-center">
              <div
                className={`mx-auto grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${
                  done ? `${theme.accent} ${theme.accentText}` : 'bg-white/20'
                }`}
              >
                {done ? <Check size={16} /> : <Utensils size={14} />}
              </div>
              <p className="mt-2 text-xs font-semibold">{step}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}


