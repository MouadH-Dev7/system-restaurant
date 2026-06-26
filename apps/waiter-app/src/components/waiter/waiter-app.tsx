'use client';

import { useState } from 'react';
import type {
  MenuItemDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
  OrderResponse,
  TableDTO,
} from '@repo/shared-types';
import {
  BellRing,
  ChefHat,
  ConciergeBell,
  Clock3,
  CreditCard,
  Globe,
  LayoutDashboard,
  Minus,
  MoveRight,
  Plus,
  Search,
  Send,
  Trash2,
  Utensils,
  Wifi,
  LogOut,
} from 'lucide-react';
import { logout } from '@/auth/service';
import { useAuthStore } from '@/auth/store';
import { formatElapsedMinutes, formatMoney, formatTime } from '@/lib/format';
import {
  formatCountLabel,
  localizeDraftLineName,
  localizeDraftModifierName,
  localizeMenuItemBadge,
  localizeMenuItemDescription,
  localizeMenuItemName,
  localizeMenuName,
  localizeModifierGroupName,
  localizeModifierOptionName,
  localizeOrderStatus,
  localizeTableLabel,
  localizeTableSearchText,
  replaceTemplate,
  waiterDir,
  waiterT,
} from '@/lib/i18n';
import { createClientId } from '@/lib/random-id';
import {
  createWaiterOrder,
  updateWaiterOrderItems,
  updateWaiterOrderStatus,
} from '@/services/orders.service';
import { updateTable } from '@/services/tables.service';
import {
  DraftLine,
  DraftModifierDetail,
  WaiterLanguage,
  getOrderForTable,
  useWaiterStore,
} from '@/store/waiter.store';
import { WaiterNotificationsPanel } from './waiter-notifications-panel';

type ComposerState = {
  item: MenuItemDTO;
  selectedOptionIds: string[];
  notes: string;
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

function sameCartSelection(
  left: Pick<DraftLine, 'menuItemId' | 'modifierOptionIds' | 'notes'>,
  right: Pick<DraftLine, 'menuItemId' | 'modifierOptionIds' | 'notes'>,
) {
  const leftModifiers = [...(left.modifierOptionIds ?? [])].sort().join('|');
  const rightModifiers = [...(right.modifierOptionIds ?? [])].sort().join('|');

  return (
    left.menuItemId === right.menuItemId &&
    leftModifiers === rightModifiers &&
    (left.notes ?? '').trim() === (right.notes ?? '').trim()
  );
}

function mapOrderItemToDraftLine(order: OrderResponse): DraftLine[] {
  return order.items.map((item) => ({
    cartLineId: item.id,
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    notes: item.notes ?? undefined,
    modifierOptionIds: item.modifiers?.flatMap((modifier) =>
      modifier.modifierOptionId ? [modifier.modifierOptionId] : [],
    ),
    name: item.menuItem?.name ?? `Item ${item.menuItemId.slice(0, 6)}`,
    nameEn: item.menuItem?.nameEn,
    nameFr: item.menuItem?.nameFr,
    nameAr: item.menuItem?.nameAr,
    image: item.menuItem?.image ?? null,
    unitPrice: item.price,
    modifierDetails: (item.modifiers ?? []).map((modifier, index) => ({
      id: modifier.id ?? `modifier-${index}`,
      modifierOptionId: modifier.modifierOptionId,
      groupName: modifier.groupName,
      groupNameEn: modifier.groupNameEn,
      groupNameFr: modifier.groupNameFr,
      groupNameAr: modifier.groupNameAr,
      optionName: modifier.optionName,
      optionNameEn: modifier.optionNameEn,
      optionNameFr: modifier.optionNameFr,
      optionNameAr: modifier.optionNameAr,
      priceDelta: modifier.priceDelta,
    })),
  }));
}

function mergeDraftLines(baseLines: DraftLine[], addedLines: DraftLine[]) {
  const merged = [...baseLines];

  for (const line of addedLines) {
    const existingIndex = merged.findIndex((entry) => sameCartSelection(entry, line));

    if (existingIndex === -1) {
      merged.push(line);
      continue;
    }

    merged[existingIndex] = {
      ...merged[existingIndex]!,
      quantity: merged[existingIndex]!.quantity + line.quantity,
    };
  }

  return merged;
}

function getDraftTotal(lines: DraftLine[]) {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

function buildDraftModifierDetails(optionIds: string[], groups: ModifierGroupDTO[]) {
  const optionsById = new Map<string, { option: ModifierOptionDTO; group: ModifierGroupDTO }>();

  for (const group of groups) {
    for (const option of group.options) {
      optionsById.set(option.id, { option, group });
    }
  }

  return optionIds.flatMap((optionId) => {
    const match = optionsById.get(optionId);

    if (!match) {
      return [];
    }

    return [
      {
        id: optionId,
        modifierOptionId: match.option.id,
        groupName: match.group.name,
        groupNameEn: match.group.nameEn,
        groupNameFr: match.group.nameFr,
        groupNameAr: match.group.nameAr,
        optionName: match.option.name,
        optionNameEn: match.option.nameEn,
        optionNameFr: match.option.nameFr,
        optionNameAr: match.option.nameAr,
        priceDelta: match.option.priceDelta,
      } satisfies DraftModifierDetail,
    ];
  });
}

function getTrackingProgress(status: OrderResponse['status']) {
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

function isTrackingStepActive(
  status: OrderResponse['status'],
  step: 'pending' | 'preparing' | 'ready' | 'delivered',
) {
  const rank = {
    PENDING: 0,
    PREPARING: 1,
    READY: 2,
    DELIVERED: 3,
    PAID: 4,
    CANCELLED: -1,
  } as const;

  const stepRank = { pending: 0, preparing: 1, ready: 2, delivered: 3 }[step];
  return rank[status] >= stepRank && status !== 'CANCELLED';
}

export function WaiterApp() {
  const restaurantId = useAuthStore((state) => state.session?.user.restaurantId);
  const session = useAuthStore((state) => state.session);
  const tables = useWaiterStore((state) => state.tables);
  const menus = useWaiterStore((state) => state.menus);
  const menuItems = useWaiterStore((state) => state.menuItems);
  const orders = useWaiterStore((state) => state.orders);
  const tableOrderGroups = useWaiterStore((state) => state.tableOrderGroups);
  const selectedTableId = useWaiterStore((state) => state.selectedTableId);
  const selectedEditableOrderId = useWaiterStore((state) => state.selectedEditableOrderId);
  const activeMenuId = useWaiterStore((state) => state.activeMenuId);
  const tableSearch = useWaiterStore((state) => state.tableSearch);
  const draftByTable = useWaiterStore((state) => state.draftByTable);
  const socketStatus = useWaiterStore((state) => state.socketStatus);
  const language = useWaiterStore((state) => state.language);
  const waiterNotifications = useWaiterStore((state) => state.waiterNotifications);
  const readNotificationIds = useWaiterStore((state) => state.readNotificationIds);
  const activeView = useWaiterStore((state) => state.activeView);
  const selectTable = useWaiterStore((state) => state.selectTable);
  const selectEditableOrder = useWaiterStore((state) => state.selectEditableOrder);
  const setActiveMenuId = useWaiterStore((state) => state.setActiveMenuId);
  const setTableSearch = useWaiterStore((state) => state.setTableSearch);
  const setTable = useWaiterStore((state) => state.setTable);
  const setLanguage = useWaiterStore((state) => state.setLanguage);
  const setActiveView = useWaiterStore((state) => state.setActiveView);
  const markAllNotificationsRead = useWaiterStore((state) => state.markAllNotificationsRead);
  const upsertOrder = useWaiterStore((state) => state.upsertOrder);
  const removeOrder = useWaiterStore((state) => state.removeOrder);
  const addDraftLine = useWaiterStore((state) => state.addDraftLine);
  const incrementDraftLine = useWaiterStore((state) => state.incrementDraftLine);
  const decrementDraftLine = useWaiterStore((state) => state.decrementDraftLine);
  const updateDraftLineNotes = useWaiterStore((state) => state.updateDraftLineNotes);
  const removeDraftLine = useWaiterStore((state) => state.removeDraftLine);
  const clearDraft = useWaiterStore((state) => state.clearDraft);
  const loadDraftFromOrder = useWaiterStore((state) => state.loadDraftFromOrder);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [busyAction, setBusyAction] = useState<'sending' | 'delivered' | 'paid' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const t = waiterT(language);
  const dir = waiterDir(language);
  const isRtl = dir === 'rtl';
  const currentUserId = session?.user.id ?? null;
  const canSettlePayment = session?.user.role === 'ADMIN';
  const isWaiterAdmin = session?.user.role === 'ADMIN';
  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
  const tableGroup =
    tableOrderGroups.find((group) => group.summary.tableId === selectedTableId) ?? null;
  const tableOrders = tableGroup?.orders ?? [];
  const activeOrder = getOrderForTable(orders, selectedTableId);
  const latestOrder = tableOrders.at(-1) ?? null;
  const editableOrder =
    tableOrders.find(
      (order) => order.id === selectedEditableOrderId && order.status === 'PENDING',
    ) ??
    [...tableOrders]
      .reverse()
      .find((order) => order.status === 'PENDING') ?? null;
  const kitchenOrder =
    [...tableOrders]
      .reverse()
      .find((order) => ['PREPARING', 'READY', 'DELIVERED'].includes(order.status)) ??
    latestOrder;
  const previewOrder = kitchenOrder ?? editableOrder ?? activeOrder ?? null;
  const currentTableOrders = [...tableOrders].filter(
    (order) => order.status !== 'PAID' && order.status !== 'CANCELLED',
  );
  const draftLines = selectedTableId ? draftByTable[selectedTableId] ?? [] : [];
  const filteredTables = tables.filter((table) => {
    const query = tableSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return localizeTableSearchText(table, language).includes(query);
  });
  const visibleMenuItems = activeMenuId
    ? menuItems.filter((item) => item.menuId === activeMenuId)
    : menuItems;
  const readyOrders = orders.filter((order) => order.status === 'READY').length;
  const activeTables = tables.filter((table) => getOrderForTable(orders, table.id)).length;
  const subtotal = getDraftTotal(draftLines);
  const tax = subtotal * 0.09;
  const total = subtotal + tax;
  const canEditPrimaryOrder = Boolean(editableOrder);
  const shouldCreateAdditionalOrder = Boolean(kitchenOrder && !editableOrder);
  const visibleWaiterNotifications = waiterNotifications.filter(
    (notification) =>
      notification.status !== 'RESOLVED' &&
      (isWaiterAdmin ||
        notification.status !== 'ACCEPTED' ||
        notification.acceptedByUserId === currentUserId),
  );
  const unreadNotificationCount = visibleWaiterNotifications.filter(
    (notification) => !readNotificationIds.includes(notification.id),
  ).length;
  const mobileNotificationsLabel = language === 'ar' ? 'الإشعارات' : language === 'fr' ? 'Notifications' : 'Notifications';

  const trackingSteps = [
    { key: 'pending' as const, label: t.stepPending, icon: Plus },
    { key: 'preparing' as const, label: t.stepPreparing, icon: ChefHat },
    { key: 'ready' as const, label: t.stepReady, icon: Utensils },
    { key: 'delivered' as const, label: t.stepDelivered, icon: ConciergeBell },
  ];

  function showFeedback(message: string) {
    setFeedback(message);
    setActionError(null);
  }

  function showError(message: string) {
    setActionError(message);
    setFeedback(null);
  }

  function handleEditPendingOrder(order: OrderResponse) {
    if (!selectedTable) {
      return;
    }

    if (order.status !== 'PENDING') {
      showError(t.originalOrderLocked);
      return;
    }

    selectEditableOrder(order.id);
    loadDraftFromOrder(selectedTable.id, order);
    showFeedback(
      replaceTemplate(t.ticketUpdated, {
        ticket: order.displayOrderId ?? order.dailyOrderNumber,
        table: selectedTable.number,
      }),
    );
  }

  function handleQuickAdd(item: MenuItemDTO) {
    setActionError(null);
    setFeedback(null);

    if (!selectedTable) {
      showError(t.selectTableBeforeAdding);
      return;
    }

    if ((item.modifierGroups?.length ?? 0) > 0) {
      setComposer({
        item,
        selectedOptionIds: [],
        notes: '',
      });
      return;
    }

    addDraftLine(selectedTable.id, {
      cartLineId: createClientId(),
      menuItemId: item.id,
      quantity: 1,
      notes: undefined,
      modifierOptionIds: [],
      name: item.name,
      nameEn: item.nameEn,
      nameFr: item.nameFr,
      nameAr: item.nameAr,
      image: item.image,
      unitPrice: item.price,
      modifierDetails: [],
    });

    showFeedback(
      replaceTemplate(t.itemAddedToTable, {
        item: localizeMenuItemName(item, language),
        table: selectedTable.number,
      }),
    );
  }

  function toggleComposerOption(group: ModifierGroupDTO, optionId: string) {
    if (!composer) {
      return;
    }

    const selectedInGroup = composer.selectedOptionIds.filter((selectedId) =>
      group.options.some((option) => option.id === selectedId),
    );
    const alreadySelected = composer.selectedOptionIds.includes(optionId);

    if (alreadySelected) {
      setComposer({
        ...composer,
        selectedOptionIds: composer.selectedOptionIds.filter((selectedId) => selectedId !== optionId),
      });
      return;
    }

    if (group.maxSelections <= 1) {
      setComposer({
        ...composer,
        selectedOptionIds: [
          ...composer.selectedOptionIds.filter(
            (selectedId) => !group.options.some((option) => option.id === selectedId),
          ),
          optionId,
        ],
      });
      return;
    }

    if (selectedInGroup.length >= group.maxSelections) {
      return;
    }

    setComposer({
      ...composer,
      selectedOptionIds: [...composer.selectedOptionIds, optionId],
    });
  }

  function handleComposerConfirm() {
    if (!composer || !selectedTable) {
      return;
    }

    const groups = composer.item.modifierGroups ?? [];

    for (const group of groups) {
      const selectedCount = composer.selectedOptionIds.filter((optionId) =>
        group.options.some((option) => option.id === optionId),
      ).length;
      const groupName = localizeModifierGroupName(group, language);

      if (group.required && selectedCount < Math.max(group.minSelections, 1)) {
        showError(replaceTemplate(t.requiredOptions, { group: groupName }));
        return;
      }

      if (selectedCount < group.minSelections) {
        showError(
          replaceTemplate(t.selectAtLeast, {
            count: group.minSelections,
            group: groupName,
          }),
        );
        return;
      }

      if (selectedCount > group.maxSelections) {
        showError(
          replaceTemplate(t.selectAtMost, {
            count: group.maxSelections,
            group: groupName,
          }),
        );
        return;
      }
    }

    const selectedOptions = groups.flatMap((group) =>
      group.options.filter((option) => composer.selectedOptionIds.includes(option.id)),
    );
    const unitPrice =
      composer.item.price + selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);

    addDraftLine(selectedTable.id, {
      cartLineId: createClientId(),
      menuItemId: composer.item.id,
      quantity: 1,
      notes: composer.notes.trim() || undefined,
      modifierOptionIds: composer.selectedOptionIds,
      name: composer.item.name,
      nameEn: composer.item.nameEn,
      nameFr: composer.item.nameFr,
      nameAr: composer.item.nameAr,
      image: composer.item.image,
      unitPrice,
      modifierDetails: buildDraftModifierDetails(composer.selectedOptionIds, groups),
    });

    setComposer(null);
    showFeedback(
      replaceTemplate(t.itemAddedToTable, {
        item: localizeMenuItemName(composer.item, language),
        table: selectedTable.number,
      }),
    );
  }

  async function markTableStatus(status: TableDTO['status']) {
    if (!selectedTable) {
      return;
    }

    const updatedTable = await updateTable(selectedTable.id, { status });
    setTable(updatedTable);
  }

  async function handleSendToKitchen() {
    if (!restaurantId) {
      showError('Missing restaurant session');
      return;
    }

    if (!selectedTable) {
      showError(t.selectTable);
      return;
    }

    if (draftLines.length === 0) {
      showError(t.addAtLeastOneItem);
      return;
    }

    setBusyAction('sending');
    setActionError(null);
    setFeedback(null);

    const linesToSubmit =
      editableOrder && selectedEditableOrderId !== editableOrder.id
        ? mergeDraftLines(mapOrderItemToDraftLine(editableOrder), draftLines)
        : draftLines;

    const items = linesToSubmit.map(({ menuItemId, quantity, notes, cartLineId, modifierOptionIds }) => ({
      menuItemId,
      quantity,
      notes,
      cartLineId,
      modifierOptionIds,
    }));

    try {
      const order = editableOrder
        ? await updateWaiterOrderItems(editableOrder.id, items, editableOrder.version)
        : await createWaiterOrder({
            restaurantId,
            tableId: selectedTable.id,
            items,
          });

      upsertOrder(order);
      selectEditableOrder(null);
      clearDraft(selectedTable.id);

      if (selectedTable.status !== 'OCCUPIED') {
        await markTableStatus('OCCUPIED');
      }

      showFeedback(
        editableOrder
          ? replaceTemplate(t.ticketUpdated, {
              ticket: order.displayOrderId ?? order.dailyOrderNumber,
              table: selectedTable.number,
            })
          : replaceTemplate(t.ticketSent, {
              ticket: order.displayOrderId ?? order.dailyOrderNumber,
            }),
      );

      if (shouldCreateAdditionalOrder) {
        showFeedback(
          `${replaceTemplate(t.ticketSent, {
            ticket: order.displayOrderId ?? order.dailyOrderNumber,
          })} ${t.originalOrderLocked}`,
        );
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : t.failedSendToKitchen);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelivered() {
    if (!kitchenOrder || !selectedTable) {
      return;
    }

    setBusyAction('delivered');
    setActionError(null);
    setFeedback(null);

    try {
      const order = await updateWaiterOrderStatus(kitchenOrder.id, 'DELIVERED');
      upsertOrder(order);
      if (selectedEditableOrderId === order.id) {
        selectEditableOrder(null);
      }
      showFeedback(
        replaceTemplate(t.tableWaitingPaymentFeedback, {
          table: selectedTable.number,
        }),
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : t.failedDelivered);
    } finally {
      setBusyAction(null);
    }
  }

  async function handlePayNow() {
    if (!kitchenOrder || !selectedTable || !canSettlePayment) {
      return;
    }

    setBusyAction('paid');
    setActionError(null);
    setFeedback(null);

    try {
      const order = await updateWaiterOrderStatus(kitchenOrder.id, 'PAID');
      removeOrder(order.id);
      if (selectedEditableOrderId === order.id) {
        selectEditableOrder(null);
      }
      clearDraft(selectedTable.id);
      await markTableStatus('AVAILABLE');
      showFeedback(
        replaceTemplate(t.paymentCompleted, {
          table: selectedTable.number,
        }),
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : t.failedPayment);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCancelEditableOrder() {
    if (!editableOrder || !selectedTable) {
      return;
    }

    setBusyAction('sending');
    setActionError(null);
    setFeedback(null);

    try {
      const order = await updateWaiterOrderStatus(editableOrder.id, 'CANCELLED');
      removeOrder(order.id);
      selectEditableOrder(null);
      clearDraft(selectedTable.id);
      showFeedback(
        replaceTemplate(t.ticketUpdated, {
          ticket: order.displayOrderId ?? order.dailyOrderNumber,
          table: selectedTable.number,
        }),
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : t.failedSendToKitchen);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div
      dir={dir}
      className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_right,rgba(255,205,160,0.22),transparent_20%),linear-gradient(180deg,#fffaf5_0%,#f7f1e9_100%)] text-slate-900 xl:flex-row"
    >
      <aside className="hidden w-[88px] flex-col border-r border-[#ead4c2] bg-white/80 px-3 py-5 backdrop-blur xl:flex">
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#8d2d0e] text-white shadow-[0_16px_28px_rgba(141,45,14,0.28)]">
          <ChefHat className="h-7 w-7" />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-3">
          <button
            type="button"
            onClick={() => setActiveView('service')}
            className={`rounded-[18px] px-3 py-4 ${
              activeView === 'service'
                ? 'bg-[#fff0e8] text-[#8d2d0e] shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <div className="flex justify-center">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <p className="mt-2 text-[11px] font-bold">{t.service}</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView('notifications');
              markAllNotificationsRead();
            }}
            className={`relative rounded-[18px] px-3 py-4 ${
              activeView === 'notifications'
                ? 'bg-[#fff0e8] text-[#8d2d0e] shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <div className="flex justify-center">
              <BellRing className="h-5 w-5" />
            </div>
            <p className="mt-2 text-[11px] font-medium">{mobileNotificationsLabel}</p>
            {unreadNotificationCount > 0 ? (
              <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadNotificationCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('tracking')}
            className={`rounded-[18px] px-3 py-4 ${
              activeView === 'tracking'
                ? 'bg-[#fff0e8] text-[#8d2d0e] shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <div className="flex justify-center">
              <Clock3 className="h-5 w-5" />
            </div>
            <p className="mt-2 text-[11px] font-medium">{t.tracking}</p>
          </button>
        </nav>
        <div className="rounded-[22px] border border-[#edd9ca] bg-[#fff6ef] p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b55229]">{t.live}</p>
          <p className="mt-2 text-xs text-slate-500">{socketStatus}</p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-3 inline-flex items-center justify-center rounded-[18px] border border-[#edd9ca] bg-white px-3 py-3 text-[#8d2d0e] transition hover:bg-[#fff2e8]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </aside>

      <aside className="w-full border-b border-[#ead4c2] bg-white/78 px-4 py-4 backdrop-blur xl:w-[300px] xl:max-w-[300px] xl:border-b-0 xl:border-r xl:px-4 xl:py-5">
        <div className="rounded-[26px] border border-[#efdbcb] bg-white px-4 py-4 shadow-[0_16px_45px_rgba(116,58,28,0.10)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#b55229]">
                {session?.user.name ?? t.waiterService}
              </p>
              <p className="mt-1 text-sm text-slate-500">{session?.user.role ?? t.service}</p>
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
            onChange={(event) => setTableSearch(event.target.value)}
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
                onClick={() => selectTable(table.id)}
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

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[#ead4c2] bg-white/85 px-4 py-4 backdrop-blur md:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#b55229]">
                {t.restaurantWaiterConsole}
              </p>
              <h1 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">
                {selectedTable ? localizeTableLabel(selectedTable.number, language) : t.selectTable}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{t.waiterDescription}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1e8] px-4 py-2 text-sm font-semibold text-[#8d2d0e]">
                <BellRing className="h-4 w-4" />
                {readyOrders > 0
                  ? replaceTemplate(t.readyForPickup, { count: readyOrders })
                  : t.noReadyAlerts}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-2 text-sm text-slate-600 ring-1 ring-[#ead4c2]">
                <Globe className="h-4 w-4" />
                {(['en', 'fr', 'ar'] as WaiterLanguage[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLanguage(value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      language === value
                        ? 'bg-[#8d2d0e] text-white'
                        : 'text-slate-600 hover:bg-[#f7eee7]'
                    }`}
                  >
                    {value === 'en' ? t.english : value === 'fr' ? t.french : t.arabic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 xl:hidden">
            <button
              type="button"
              onClick={() => setActiveView('service')}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                activeView === 'service'
                  ? 'bg-[#8d2d0e] text-white shadow-[0_12px_24px_rgba(141,45,14,0.18)]'
                  : 'bg-white text-slate-700 ring-1 ring-[#ead4c2]'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              {t.service}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('notifications');
                markAllNotificationsRead();
              }}
              className={`relative inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                activeView === 'notifications'
                  ? 'bg-[#8d2d0e] text-white shadow-[0_12px_24px_rgba(141,45,14,0.18)]'
                  : 'bg-white text-slate-700 ring-1 ring-[#ead4c2]'
              }`}
            >
              <BellRing className="h-4 w-4" />
              {mobileNotificationsLabel}
              {unreadNotificationCount > 0 ? (
                <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadNotificationCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('tracking')}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                activeView === 'tracking'
                  ? 'bg-[#8d2d0e] text-white shadow-[0_12px_24px_rgba(141,45,14,0.18)]'
                  : 'bg-white text-slate-700 ring-1 ring-[#ead4c2]'
              }`}
            >
              <Clock3 className="h-4 w-4" />
              {t.tracking}
            </button>
            <div className="col-span-2 flex items-center justify-between rounded-[18px] bg-[#fff6ef] px-4 py-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-[#8d2d0e]" />
                <span>{socketStatus}</span>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-2 rounded-full border border-[#edd9ca] bg-white px-3 py-2 text-[#8d2d0e]"
              >
                <LogOut className="h-4 w-4" />
                {t.signOut}
              </button>
            </div>
          </div>
        </header>

        {activeView === 'notifications' ? (
          <div className="flex min-h-0 flex-1 px-4 py-4 md:px-5 md:py-5">
            <WaiterNotificationsPanel />
          </div>
        ) : activeView === 'tracking' ? (
          <div className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-5 md:py-5">
            <div className="rounded-[28px] border border-[#ecd8c7] bg-white px-5 py-5 shadow-[0_18px_45px_rgba(116,58,28,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b55229]">
                {t.trackTableOrders}
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {selectedTable ? localizeTableLabel(selectedTable.number, language) : t.selectTable}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {selectedTable
                  ? replaceTemplate(t.trackingOrdersCount, { count: tableOrders.length })
                  : t.trackOrdersHint}
              </p>
            </div>

            {!selectedTable ? (
              <div className="mt-5 rounded-[28px] border border-dashed border-[#dcc6b5] bg-[#fff9f4] px-5 py-12 text-center text-sm text-slate-500">
                {t.trackOrdersHint}
              </div>
            ) : tableOrders.length === 0 ? (
              <div className="mt-5 rounded-[28px] border border-dashed border-[#dcc6b5] bg-[#fff9f4] px-5 py-12 text-center text-sm text-slate-500">
                {t.noOrdersForTracking}
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {tableOrders.map((order) => {
                  const progress = getTrackingProgress(order.status);

                  return (
                    <article
                      key={order.id}
                      className="rounded-[28px] border border-[#ead7c8] bg-white px-5 py-5 shadow-[0_16px_45px_rgba(116,58,28,0.06)]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b55229]">
                            {t.currentTicket}
                          </p>
                          <h3 className="mt-2 text-2xl font-black text-slate-950">
                            #{order.displayOrderId ?? order.dailyOrderNumber}
                          </h3>
                          <p className="mt-2 text-sm font-semibold text-[#8d2d0e]">
                            {localizeOrderStatus(order.status, language)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{t.trackingUpdatedLive}</p>
                        </div>
                        <div className={`rounded-[20px] bg-[#fff7f0] px-4 py-3 ${isRtl ? 'text-left' : 'text-right'}`}>
                          <p className="text-xs text-slate-500">{t.total}</p>
                          <p className="mt-1 text-xl font-black text-slate-950">
                            {formatMoney(order.grandTotal, language)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatElapsedMinutes(order.createdAt, language)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.95fr)] xl:items-start">
                        <div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#f0e2d4]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#8d2d0e,#cf835f)] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          {trackingSteps.map((step, index) => {
                            const active = isTrackingStepActive(order.status, step.key);
                            const Icon = step.icon;

                            return (
                              <div
                                key={step.key}
                                className={`rounded-[20px] px-4 py-4 transition ${
                                  active
                                    ? 'bg-[#fff3ea] text-[#8d2d0e] ring-1 ring-[#cf835f]'
                                    : 'bg-[#f7f3ef] text-slate-400'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                      active ? 'bg-[#8d2d0e] text-white' : 'bg-white text-slate-400'
                                    }`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em]">
                                      0{index + 1}
                                    </p>
                                    <p className="mt-1 text-sm font-bold">{step.label}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        </div>

                        <div className="hidden rounded-[22px] bg-[#fcf8f3] px-4 py-4 xl:block">
                          <p className="text-sm font-bold text-slate-950">{t.items}</p>
                          <div className="mt-3 space-y-3">
                            {order.items.map((item) => (
                              <div
                                key={`tracking-side-${item.id}`}
                                className="rounded-[20px] border border-[#f0dfd1] bg-[linear-gradient(180deg,#fffdfb_0%,#fff7f1_100%)] px-4 py-3 shadow-[0_8px_24px_rgba(116,58,28,0.05)]"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-[#8d2d0e] px-2.5 py-1 text-[11px] font-bold text-white">
                                        {t.qtyLabel} {item.quantity}
                                      </span>
                                      <p className="text-sm font-semibold text-slate-950">
                                        {item.menuItem
                                          ? localizeMenuItemName(item.menuItem, language)
                                          : item.menuItemId}
                                      </p>
                                    </div>
                                    {item.notes ? (
                                      <div className="mt-3 rounded-[16px] bg-[#fff3ea] px-3 py-2">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b55229]">
                                          {t.notesLabel}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600">{item.notes}</p>
                                      </div>
                                    ) : null}
                                    {item.modifiers?.length ? (
                                      <div className="mt-3 rounded-[16px] bg-white px-3 py-2 ring-1 ring-[#f1e3d7]">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                          {t.addonsLabel}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {item.modifiers.map((modifier, index) => (
                                            <span
                                              key={`${item.id}-modifier-${index}`}
                                              className="rounded-full bg-[#f7efe8] px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                                            >
                                              {modifier.groupName}: {modifier.optionName}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                  <p className="text-sm font-bold text-slate-700">
                                    {formatMoney(item.price * item.quantity, language)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-[22px] bg-[#fcf8f3] px-4 py-4 xl:hidden">
                        <p className="text-sm font-bold text-slate-950">{t.items}</p>
                        <div className="mt-3 space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-[20px] border border-[#f0dfd1] bg-[linear-gradient(180deg,#fffdfb_0%,#fff7f1_100%)] px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-950">
                                  {item.quantity} ×{' '}
                                  {item.menuItem
                                    ? localizeMenuItemName(item.menuItem, language)
                                    : item.menuItemId}
                                </p>
                                {item.notes ? (
                                  <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                                ) : null}
                              </div>
                              <p className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700 ring-1 ring-[#f1e3d7]">
                                {formatMoney(item.price * item.quantity, language)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col 2xl:flex-row">
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
                  onClick={() => setActiveMenuId(null)}
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
                    onClick={() => setActiveMenuId(menu.id)}
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
                        onClick={() => handleQuickAdd(item)}
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
                      onClick={() => handleEditPendingOrder(order)}
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
                          {formatMoney(order.grandTotal, language)}
                        </p>
                      </div>
                      <div className="mt-3 space-y-2">
                        {order.items.map((item) => (
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
                          {formatMoney(order.grandTotal, language)}
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
                        onClick={() => selectedTable && removeDraftLine(selectedTable.id, line.cartLineId)}
                        className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border border-[#e8d1be] bg-[#fff8f2]">
                        <button
                          type="button"
                          onClick={() => selectedTable && decrementDraftLine(selectedTable.id, line.cartLineId)}
                          className="p-3 text-[#8d2d0e]"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-10 text-center text-sm font-bold text-slate-900">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => selectedTable && incrementDraftLine(selectedTable.id, line.cartLineId)}
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
                      onChange={(event) =>
                        selectedTable &&
                        updateDraftLineNotes(selectedTable.id, line.cartLineId, event.target.value)
                      }
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
                  onClick={handleSendToKitchen}
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
                    onClick={handleCancelEditableOrder}
                    disabled={!editableOrder || busyAction !== null}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-rose-50 font-semibold text-rose-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelivered}
                    disabled={!kitchenOrder || kitchenOrder.status !== 'READY' || busyAction !== null}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[#eefaf3] font-semibold text-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MoveRight className="h-4 w-4" />
                    {busyAction === 'delivered' ? t.updating : t.markDelivered}
                  </button>
                  {canSettlePayment ? (
                    <button
                      type="button"
                      onClick={handlePayNow}
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
          </div>
        )}
      </main>

      {composer ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-4 shadow-[0_28px_80px_rgba(37,18,10,0.30)] sm:rounded-[32px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b55229]">{t.customizeItem}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {localizeMenuItemName(composer.item, language)}
                </h2>
                <p className="mt-2 text-sm text-slate-500">{t.chooseModifiers}</p>
              </div>
              <button
                type="button"
                onClick={() => setComposer(null)}
                className="rounded-full bg-[#f6eee7] p-3 text-slate-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {(composer.item.modifierGroups ?? []).map((group) => (
                <div key={group.id} className="rounded-[24px] border border-[#ead7c8] bg-[#fffaf6] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">
                        {localizeModifierGroupName(group, language)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {group.required
                          ? `${t.statusOccupied} • ${replaceTemplate(t.selectAtLeast, {
                              count: Math.max(group.minSelections, 1),
                              group: localizeModifierGroupName(group, language),
                            })}`
                          : `${t.available} • ${replaceTemplate(t.selectAtMost, {
                              count: group.maxSelections,
                              group: localizeModifierGroupName(group, language),
                            })}`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {group.options.map((option) => {
                      const selected = composer.selectedOptionIds.includes(option.id);

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleComposerOption(group, option.id)}
                          className={`rounded-[18px] border px-4 py-3 transition ${
                            selected
                              ? 'border-[#c76d45] bg-[#fff0e8] shadow-sm'
                              : 'border-[#e8d5c6] bg-white hover:border-[#d7a285]'
                          } ${isRtl ? 'text-right' : 'text-left'}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {localizeModifierOptionName(option, language)}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {option.priceDelta > 0
                                  ? `+${formatMoney(option.priceDelta, language)}`
                                  : t.included}
                              </p>
                            </div>
                            {selected ? (
                              <span className="rounded-full bg-[#8d2d0e] px-3 py-1 text-xs font-bold text-white">
                                {t.selected}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">{t.kitchenNote}</span>
              <textarea
                value={composer.notes}
                onChange={(event) => setComposer({ ...composer, notes: event.target.value })}
                rows={3}
                placeholder={t.kitchenNotePlaceholder}
                className="mt-2 w-full rounded-[20px] border border-[#e8d5c6] bg-[#fffdfa] px-4 py-3 text-sm outline-none focus:border-[#cf835f]"
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setComposer(null)}
                className="h-12 rounded-[18px] border border-[#e8d5c6] px-6 font-semibold text-slate-700"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleComposerConfirm}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[#8d2d0e] px-6 font-bold text-white"
              >
                <Plus className="h-4 w-4" />
                {t.addToTicket}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
