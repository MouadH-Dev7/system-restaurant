'use client';

import { useCallback, useState } from 'react';
import type {
  MenuItemDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
  OrderResponse,
  TableDTO,
} from '@repo/shared-types';

import { logout } from '@/auth/service';
import { useAuthStore } from '@/auth/store';
import {
  localizeMenuItemName,
  localizeModifierGroupName,
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
  getOrderForTable,
  useWaiterStore,
} from '@/store/waiter.store';
import { WaiterNotificationsPanel } from './waiter-notifications-panel';
import { ModifierComposerModal, WaiterDraftPanel, WaiterHeader, WaiterProductGrid, WaiterSidebar, WaiterTableList, WaiterTrackingView } from './sections';
import {
  buildDraftModifierDetails,
  getDraftTotal,
  mapOrderItemToDraftLine,
  mergeDraftLines,
} from './sections/waiter-order-helpers';
import type { ComposerState } from './sections/ModifierComposerModal';

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
  function showFeedback(message: string) {
    setFeedback(message);
    setActionError(null);
  }

  function showError(message: string) {
    setActionError(message);
    setFeedback(null);
  }

  const handleEditPendingOrder = useCallback((order: OrderResponse) => {
    if (!selectedTable) {
      return;
    }

    if (order.status !== 'PENDING') {
      setActionError(t.originalOrderLocked);
      setFeedback(null);
      return;
    }

    selectEditableOrder(order.id);
    loadDraftFromOrder(selectedTable.id, order);
    setFeedback(
      replaceTemplate(t.ticketUpdated, {
        ticket: order.displayOrderId ?? order.dailyOrderNumber,
        table: selectedTable.number,
      }),
    );
    setActionError(null);
  }, [selectedTable, selectEditableOrder, loadDraftFromOrder, t]);

  const handleQuickAdd = useCallback((item: MenuItemDTO) => {
    setActionError(null);
    setFeedback(null);

    if (!selectedTable) {
      setActionError(t.selectTableBeforeAdding);
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

    setFeedback(
      replaceTemplate(t.itemAddedToTable, {
        item: localizeMenuItemName(item, language),
        table: selectedTable.number,
      }),
    );
  }, [selectedTable, language, addDraftLine]);

  const toggleComposerOption = useCallback((group: ModifierGroupDTO, optionId: string) => {
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
  }, [composer, setComposer]);

  const handleComposerConfirm = useCallback(() => {
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
        setActionError(replaceTemplate(t.requiredOptions, { group: groupName }));
        setFeedback(null);
        return;
      }

      if (selectedCount < group.minSelections) {
        setActionError(
          replaceTemplate(t.selectAtLeast, {
            count: group.minSelections,
            group: groupName,
          }),
        );
        setFeedback(null);
        return;
      }

      if (selectedCount > group.maxSelections) {
        setActionError(
          replaceTemplate(t.selectAtMost, {
            count: group.maxSelections,
            group: groupName,
          }),
        );
        setFeedback(null);
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
    setFeedback(
      replaceTemplate(t.itemAddedToTable, {
        item: localizeMenuItemName(composer.item, language),
        table: selectedTable.number,
      }),
    );
    setActionError(null);
  }, [composer, selectedTable, addDraftLine, language, t]);

  const markTableStatus = useCallback(async (status: TableDTO['status']) => {
    if (!selectedTable) {
      return;
    }

    const updatedTable = await updateTable(selectedTable.id, { status });
    setTable(updatedTable);
  }, [selectedTable, setTable]);

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

  const handleDelivered = useCallback(async () => {
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
      setFeedback(
        replaceTemplate(t.tableWaitingPaymentFeedback, {
          table: selectedTable.number,
        }),
      );
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t.failedDelivered);
      setFeedback(null);
    } finally {
      setBusyAction(null);
    }
  }, [kitchenOrder, selectedTable, selectedEditableOrderId, upsertOrder, selectEditableOrder, t]);

  const handlePayNow = useCallback(async () => {
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
      setFeedback(
        replaceTemplate(t.paymentCompleted, {
          table: selectedTable.number,
        }),
      );
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t.failedPayment);
      setFeedback(null);
    } finally {
      setBusyAction(null);
    }
  }, [kitchenOrder, selectedTable, canSettlePayment, selectedEditableOrderId, removeOrder, selectEditableOrder, clearDraft, markTableStatus, t]);

  const handleCancelEditableOrder = useCallback(async () => {
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
      setFeedback(
        replaceTemplate(t.ticketUpdated, {
          ticket: order.displayOrderId ?? order.dailyOrderNumber,
          table: selectedTable.number,
        }),
      );
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t.failedSendToKitchen);
      setFeedback(null);
    } finally {
      setBusyAction(null);
    }
  }, [editableOrder, selectedTable, removeOrder, selectEditableOrder, clearDraft, t]);

  const handleRemoveDraftLine = useCallback((cartLineId: string) => {
    if (!selectedTable) return;
    removeDraftLine(selectedTable.id, cartLineId);
  }, [selectedTable, removeDraftLine]);

  const handleIncrementDraftLine = useCallback((cartLineId: string) => {
    if (!selectedTable) return;
    incrementDraftLine(selectedTable.id, cartLineId);
  }, [selectedTable, incrementDraftLine]);

  const handleDecrementDraftLine = useCallback((cartLineId: string) => {
    if (!selectedTable) return;
    decrementDraftLine(selectedTable.id, cartLineId);
  }, [selectedTable, decrementDraftLine]);

  const handleUpdateDraftLineNotes = useCallback((cartLineId: string, notes: string) => {
    if (!selectedTable) return;
    updateDraftLineNotes(selectedTable.id, cartLineId, notes);
  }, [selectedTable, updateDraftLineNotes]);

  const handleSelectTable = useCallback((tableId: string) => {
    selectTable(tableId);
  }, [selectTable]);

  const handleCloseComposer = useCallback(() => {
    setComposer(null);
  }, []);

  const handleComposerNotesChange = useCallback((notes: string) => {
    setComposer((prev) => (prev ? { ...prev, notes } : null));
  }, []);

  return (
    <div
      dir={dir}
      className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_right,rgba(255,205,160,0.22),transparent_20%),linear-gradient(180deg,#fffaf5_0%,#f7f1e9_100%)] text-slate-900 xl:flex-row"
    >
      <WaiterSidebar
        language={language}
        activeView={activeView}
        socketStatus={socketStatus}
        unreadNotificationCount={unreadNotificationCount}
        onSetActiveView={setActiveView}
        onMarkAllNotificationsRead={markAllNotificationsRead}
        onLogout={() => void logout()}
      />

      <WaiterTableList
        waiterName={session?.user.name ?? null}
        waiterRole={session?.user.role ?? null}
        orders={orders}
        selectedTableId={selectedTableId}
        tableSearch={tableSearch}
        language={language}
        isRtl={isRtl}
        activeTables={activeTables}
        readyOrders={readyOrders}
        filteredTables={filteredTables}
        onSelectTable={handleSelectTable}
        onSearchChange={setTableSearch}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <WaiterHeader
          language={language}
          selectedTable={selectedTable}
          readyOrders={readyOrders}
          unreadNotificationCount={unreadNotificationCount}
          activeView={activeView}
          socketStatus={socketStatus}
          onSetActiveView={setActiveView}
          onMarkAllNotificationsRead={markAllNotificationsRead}
          onSetLanguage={setLanguage}
          onLogout={() => void logout()}
        />

        {activeView === 'notifications' ? (
          <div className="flex min-h-0 flex-1 px-4 py-4 md:px-5 md:py-5">
            <WaiterNotificationsPanel />
          </div>
        ) : activeView === 'tracking' ? (
          <WaiterTrackingView
            selectedTable={selectedTable}
            tableOrders={tableOrders}
            language={language}
            isRtl={isRtl}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col 2xl:flex-row">
          <WaiterProductGrid
            selectedTable={selectedTable}
            activeMenuId={activeMenuId}
            menus={menus}
            visibleMenuItems={visibleMenuItems}
            feedback={feedback}
            actionError={actionError}
            kitchenOrder={kitchenOrder}
            language={language}
            onSetActiveMenuId={setActiveMenuId}
            onQuickAdd={handleQuickAdd}
          />

          <WaiterDraftPanel
            selectedTable={selectedTable}
            draftLines={draftLines}
            kitchenOrder={kitchenOrder}
            currentTableOrders={currentTableOrders}
            previewOrder={previewOrder}
            tableOrders={tableOrders}
            language={language}
            isRtl={isRtl}
            subtotal={subtotal}
            tax={tax}
            total={total}
            canEditPrimaryOrder={canEditPrimaryOrder}
            shouldCreateAdditionalOrder={shouldCreateAdditionalOrder}
            busyAction={busyAction}
            canSettlePayment={canSettlePayment}
            editableOrder={editableOrder}
            selectedEditableOrderId={selectedEditableOrderId}
            onEditPendingOrder={handleEditPendingOrder}
            onRemoveDraftLine={handleRemoveDraftLine}
            onIncrementDraftLine={handleIncrementDraftLine}
            onDecrementDraftLine={handleDecrementDraftLine}
            onUpdateDraftLineNotes={handleUpdateDraftLineNotes}
            onSendToKitchen={handleSendToKitchen}
            onCancelEditableOrder={handleCancelEditableOrder}
            onDelivered={handleDelivered}
            onPayNow={handlePayNow}
          />
          </div>
        )}
      </main>

      <ModifierComposerModal
        composer={composer}
        language={language}
        isRtl={isRtl}
        onToggleOption={toggleComposerOption}
        onConfirm={handleComposerConfirm}
        onClose={handleCloseComposer}
        onNotesChange={handleComposerNotesChange}
      />
    </div>
  );
}
