'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { usePosTableSync } from '@/hooks/use-pos-table-sync';
import { computeOrderTotal, findTable, usePosTablesView } from '@/hooks/use-pos-selectors';
import { usePosOrderActions } from '@/hooks/use-pos-order-actions';
import { formatCountLabel, posT } from '@/lib/i18n';
import { usePosUiStore } from '@/store/pos-ui.store';
import { usePosDataStore } from '@/store/pos-data.store';
import { updateTable } from '@/services/tables.service';
import { FloorPlan, TableDetailPanel } from '@/components/tables-sections';

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

  const handleZoomIn = useCallback(() => {
    setZoom((current) => Math.min(1.8, Number((current + 0.1).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((current) => Math.max(0.7, Number((current - 0.1).toFixed(2))));
  }, []);

  const handleTablePointerDown = useCallback(
    (tableId: string, clientX: number, clientY: number) => {
      setDraggingTableId(tableId);
      handlePointerMove(clientX, clientY);
    },
    [],
  );

  const handleEditOrder = useCallback(
    (orderId: string) => {
      selectOrder(orderId);
      setActiveScreen('order-detail');
    },
    [selectOrder, setActiveScreen],
  );

  const handlePayOrder = useCallback(
    (orderId: string) => {
      openCheckout({ type: 'order', orderId });
    },
    [openCheckout],
  );

  const handleToggleMoveMode = useCallback(
    (tableId: string) => {
      selectTable(tableId);
      setMoveMode((current) => !current);
    },
    [selectTable],
  );

  const handlePayTable = useCallback(
    (tableId: string) => {
      openCheckout({ type: 'table', tableId });
    },
    [openCheckout],
  );

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
        <FloorPlan
          visibleTables={visibleTables}
          selectedTableId={selectedTableId}
          activeTable={activeTable}
          moveMode={moveMode}
          draggingTableId={draggingTableId}
          zoom={zoom}
          positionOverrides={positionOverrides}
          language={language}
          t={t}
          mapRef={mapRef}
          onSelectTable={selectTable}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onTablePointerDown={handleTablePointerDown}
          resolvePosition={resolvePosition}
        />

        {activeTable ? (
          <TableDetailPanel
            activeTable={activeTable}
            activeTableOrders={activeTableOrders}
            totals={totals}
            moveMode={moveMode}
            moveButtonLabel={moveButtonLabel}
            savingLayoutId={savingLayoutId}
            language={language}
            t={t}
            onStartCompose={startTableCompose}
            onEditOrder={handleEditOrder}
            onPayOrder={handlePayOrder}
            onToggleMoveMode={handleToggleMoveMode}
            onPayTable={handlePayTable}
          />
        ) : null}
      </div>
    </div>
  );
}
