'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FloorDTO, TableDTO, TableStatus, UpdateTableInput } from '@repo/shared-types';
import { Download, Eye, Pencil, Plus, Printer, Trash2, X } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { getSettings } from '@/services/settings.service';
import { useAppStore } from '@/store/app.store';
import {
  createFloor,
  createTable,
  deleteFloor,
  deleteTable,
  listFloors,
  listTables,
  updateFloor,
  updateTable,
} from '@/services/tables.service';

type TableFormState = {
  number: string;
  capacity: string;
  status: TableStatus;
  floorId: string;
  shape: 'round' | 'square';
};

type FloorFormState = {
  name: string;
};

const initialTableForm: TableFormState = {
  number: '',
  capacity: '',
  status: 'AVAILABLE',
  floorId: '',
  shape: 'round',
};

const initialFloorForm: FloorFormState = {
  name: '',
};

export function TablesScreen() {
  const { t, statusLabel } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [tables, setTables] = useState<TableDTO[]>([]);
  const [floors, setFloors] = useState<FloorDTO[]>([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableForm, setTableForm] = useState<TableFormState>(initialTableForm);
  const [floorForm, setFloorForm] = useState<FloorFormState>(initialFloorForm);
  const [editingTable, setEditingTable] = useState<TableDTO | null>(null);
  const [editingFloor, setEditingFloor] = useState<FloorDTO | null>(null);
  const [qrPreviewTable, setQrPreviewTable] = useState<TableDTO | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('ALL');
  const [selectedLayoutTableId, setSelectedLayoutTableId] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [positionOverrides, setPositionOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void loadCurrentData();
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      setRestaurantName('');
      return;
    }

    const activeRestaurantId = restaurantId;
    let active = true;

    async function loadRestaurantName() {
      try {
        const settings = await getSettings(activeRestaurantId);
        if (active) {
          setRestaurantName(settings?.restaurantName?.trim() ?? '');
        }
      } catch {
        if (active) {
          setRestaurantName('');
        }
      }
    }

    void loadRestaurantName();

    return () => {
      active = false;
    };
  }, [restaurantId]);

  async function loadCurrentData() {
    if (!restaurantId) {
      setTables([]);
      setFloors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextTables, nextFloors] = await Promise.all([
        listTables(restaurantId),
        listFloors(),
      ]);
      setTables(nextTables);
      setFloors(nextFloors);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('tables.title')));
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(
    () => ({
      available: tables.filter((table) => table.status === 'AVAILABLE').length,
      reserved: tables.filter((table) => table.status === 'RESERVED').length,
      occupied: tables.filter((table) => table.status === 'OCCUPIED').length,
    }),
    [tables],
  );

  const sortedFloors = useMemo(
    () => floors.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [floors],
  );

  const visibleTables = useMemo(
    () =>
      selectedFloorId === 'ALL'
        ? tables
        : tables.filter((table) => table.floorId === selectedFloorId),
    [selectedFloorId, tables],
  );

  const selectedLayoutTable =
    visibleTables.find((table) => table.id === selectedLayoutTableId) ?? visibleTables[0] ?? null;

  const groupedTables = useMemo(
    () =>
      sortedFloors.map((floor) => ({
        floor,
        tables: tables
          .filter((table) => table.floorId === floor.id)
          .sort((a, b) => a.number - b.number),
      })),
    [sortedFloors, tables],
  );

  function resolveFloorName(table: TableDTO) {
    return table.floorName ?? sortedFloors.find((floor) => floor.id === table.floorId)?.name ?? 'Main Floor';
  }

  function computeFallbackPosition(count: number, index: number) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
    const rows = Math.max(1, Math.ceil(count / cols));
    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      x: 10 + ((col + 0.5) / cols) * 80,
      y: 12 + ((row + 0.5) / rows) * 68,
    };
  }

  function normalizeCoordinate(value: number | null, fallback: number, axis: 'x' | 'y') {
    if (value === null || Number.isNaN(value)) {
      return fallback;
    }

    const normalized = value > 0 && value <= 1 ? value * 100 : value;
    const min = axis === 'x' ? 8 : 10;
    const max = axis === 'x' ? 92 : 82;

    if (normalized < min || normalized > max) {
      return fallback;
    }

    return normalized;
  }

  function resolveLayoutPosition(table: TableDTO, index: number, count: number) {
    const fallback = computeFallbackPosition(count, index);
    return positionOverrides[table.id] ?? {
      x: normalizeCoordinate(table.posX, fallback.x, 'x'),
      y: normalizeCoordinate(table.posY, fallback.y, 'y'),
    };
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

  async function persistLayoutPosition(tableId: string, x: number, y: number) {
    const updated = await updateTable(tableId, { posX: x, posY: y });
    setTables((current) => current.map((table) => (table.id === updated.id ? updated : table)));
    setPositionOverrides((current) => {
      const next = { ...current };
      delete next[tableId];
      return next;
    });
  }

  function handlePointerMove(clientX: number, clientY: number) {
    if (!draggingTableId || !moveMode) {
      return;
    }

    const position = readMapPosition(clientX, clientY);
    if (!position) {
      return;
    }

    setPositionOverrides((current) => ({
      ...current,
      [draggingTableId]: position,
    }));
  }

  async function handlePointerUp() {
    if (!draggingTableId) {
      return;
    }

    const tableId = draggingTableId;
    const override = positionOverrides[tableId];
    setDraggingTableId(null);

    if (!override) {
      return;
    }

    await persistLayoutPosition(tableId, override.x, override.y);
  }

  function openCreateTableModal(floorId?: string) {
    setEditingTable(null);
    setTableForm({
      ...initialTableForm,
      floorId: floorId ?? sortedFloors[0]?.id ?? '',
    });
    setShowTableModal(true);
  }

  function openEditTableModal(table: TableDTO) {
    setEditingTable(table);
    setTableForm({
      number: String(table.number),
      capacity: String(table.capacity),
      status: table.status,
      floorId: table.floorId ?? '',
      shape: table.shape ?? 'round',
    });
    setShowTableModal(true);
  }

  function closeTableModal() {
    if (saving) {
      return;
    }

    setShowTableModal(false);
    setEditingTable(null);
    setTableForm(initialTableForm);
  }

  function openCreateFloorModal() {
    setEditingFloor(null);
    setFloorForm(initialFloorForm);
    setShowFloorModal(true);
  }

  function openEditFloorModal(floor: FloorDTO) {
    setEditingFloor(floor);
    setFloorForm({ name: floor.name });
    setShowFloorModal(true);
  }

  function closeFloorModal() {
    if (saving) {
      return;
    }

    setShowFloorModal(false);
    setEditingFloor(null);
    setFloorForm(initialFloorForm);
  }

  async function handleSaveTable() {
    if (!restaurantId) {
      setError(t('tables.title'));
      return;
    }

    const number = Number(tableForm.number);
    const capacity = Number(tableForm.capacity);

    if (!number || !capacity || !tableForm.floorId) {
      setError(`${t('tables.number')} / ${t('tables.capacity')}`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const floor = sortedFloors.find((entry) => entry.id === tableForm.floorId);
      const payload: UpdateTableInput & {
        restaurantId?: string;
      } = {
        number,
        capacity,
        status: tableForm.status,
        floorId: tableForm.floorId,
        floorName: floor?.name ?? null,
        posX: null,
        posY: null,
        shape: tableForm.shape,
      };

      if (editingTable) {
        const updated = await updateTable(editingTable.id, payload);
        setTables((current) => current.map((table) => (table.id === updated.id ? updated : table)));
      } else {
        const created = await createTable({
          restaurantId,
          number,
          capacity,
          status: tableForm.status,
          floorId: tableForm.floorId,
          floorName: floor?.name ?? null,
          posX: null,
          posY: null,
          shape: tableForm.shape,
        });
        setTables((current) => [...current, created].sort((a, b) => a.number - b.number));
        setQrPreviewTable(created);
      }

      closeTableModal();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('tables.createTable')));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFloor() {
    if (!floorForm.name.trim()) {
      setError(t('tables.title'));
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingFloor) {
        const updated = await updateFloor(editingFloor.id, { name: floorForm.name.trim() });
        setFloors((current) => current.map((floor) => (floor.id === updated.id ? updated : floor)));
      } else {
        const created = await createFloor({
          name: floorForm.name.trim(),
          sortOrder: floors.length,
        });
        setFloors((current) => [...current, created]);
        setSelectedFloorId(created.id);
      }

      await loadCurrentData();
      closeFloorModal();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('tables.createTitle')));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTable(table: TableDTO) {
    if (!window.confirm(`${t('tables.delete')} ${t('tables.table')} ${table.number}?`)) {
      return;
    }

    try {
      await deleteTable(table.id);
      setTables((current) => current.filter((entry) => entry.id !== table.id));
      setError(null);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('tables.delete')));
    }
  }

  async function handleDeleteFloor(floor: FloorDTO) {
    if (!window.confirm(`${t('tables.delete')} ${floor.name}?`)) {
      return;
    }

    try {
      await deleteFloor(floor.id);
      setFloors((current) => current.filter((entry) => entry.id !== floor.id));
      if (selectedFloorId === floor.id) {
        setSelectedFloorId('ALL');
      }
      setError(null);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('tables.delete')));
    }
  }

  function downloadQr(table: TableDTO) {
    const link = document.createElement('a');
    link.href = table.qrCodeUrl;
    link.download = `table-${table.number}-qr.png`;
    link.click();
  }

  function printQr(table?: TableDTO) {
    const selected = table ? [table] : visibleTables;
    const popup = window.open('', '_blank', 'width=1200,height=900');
    if (!popup) {
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>${t('tables.printA4Sheet')}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { margin: 0; font-family: Arial, sans-serif; color: #131b2e; }
            .sheet { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
            .card { break-inside: avoid; border: 1px solid #dbe2ea; border-radius: 14px; padding: 20px; text-align: center; }
            h1 { margin: 0 0 8px; font-size: 20px; }
            h2 { margin: 0 0 8px; font-size: 28px; color: #ac2d00; }
            h3 { margin: 0 0 16px; font-size: 16px; color: #475569; }
            img { width: 220px; height: 220px; object-fit: contain; }
            p { margin: 16px 0 0; font-size: 18px; font-weight: 700; }
          </style>
        </head>
        <body>
          <section class="sheet">
            ${selected
              .map(
                (item) => `
                  <article class="card">
                    <h1>${restaurantName || t('common.restaurant')}</h1>
                    <h2>${t('tables.table')} ${item.number}</h2>
                    <h3>${resolveFloorName(item)}</h3>
                    <img src="${item.qrCodeUrl}" alt="QR ${t('tables.table')} ${item.number}" />
                    <p>${t('tables.scanToOrder')}</p>
                  </article>
                `,
              )
              .join('')}
          </section>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    popup.document.close();
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('tables.title')}</h2>
          <p>{t('tables.subtitle')}</p>
        </div>

        <div className="header-actions">
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={selectedFloorId}
            onChange={(event) => setSelectedFloorId(event.target.value)}
          >
            <option value="ALL">All floors</option>
            {sortedFloors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>

          <button type="button" className="ghost-btn" onClick={openCreateFloorModal}>
            <Plus size={16} />
            <span>Floor</span>
          </button>

          <button type="button" className="primary-btn" onClick={() => openCreateTableModal()}>
            <Plus size={16} />
            <span>{t('tables.createTable')}</span>
          </button>
        </div>
      </section>

      {error ? <div className="panel error-banner">{error}</div> : null}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_1fr]">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>{t('tables.floorMap')}</h3>
              <p>{t('tables.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="ghost-btn small"
                onClick={() => setMoveMode((current) => !current)}
                disabled={!selectedLayoutTable}
              >
                <span>
                  {moveMode
                    ? 'Finish moving'
                    : 'Move selected table'}
                </span>
              </button>
            </div>
          </div>

          <div className="table-legend">
            <span>
              <i className="dot success" />
              {statusLabel('AVAILABLE')} {counts.available}
            </span>
            <span>
              <i className="dot warning" />
              {statusLabel('RESERVED')} {counts.reserved}
            </span>
            <span>
              <i className="dot tertiary" />
              {statusLabel('OCCUPIED')} {counts.occupied}
            </span>
          </div>

          {loading ? (
            <div className="empty-state">
              <h3>{t('tables.loading')}</h3>
              <p>{t('tables.subtitle')}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle,_rgba(220,184,160,0.35)_1px,_transparent_1px)] [background-size:28px_28px] p-4">
                <div
                  ref={mapRef}
                  className="relative min-h-[520px] overflow-hidden rounded-[28px] bg-white/60"
                  onPointerMove={(event) => handlePointerMove(event.clientX, event.clientY)}
                  onPointerUp={() => void handlePointerUp()}
                  onPointerLeave={() => void handlePointerUp()}
                >
                  {visibleTables.map((table, index) => {
                    const active = table.id === selectedLayoutTable?.id;
                    const position = resolveLayoutPosition(table, index, visibleTables.length);

                    return (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => setSelectedLayoutTableId(table.id)}
                        onPointerDown={(event) => {
                          if (!moveMode || table.id !== selectedLayoutTable?.id) {
                            return;
                          }

                          event.preventDefault();
                          setDraggingTableId(table.id);
                          handlePointerMove(event.clientX, event.clientY);
                        }}
                        className={[
                          'absolute flex h-24 w-24 items-center justify-center text-white shadow-lg transition',
                          table.shape === 'square' ? 'rounded-[28px]' : 'rounded-full',
                          table.status === 'AVAILABLE'
                            ? 'bg-emerald-500'
                            : table.status === 'RESERVED'
                              ? 'bg-amber-500'
                              : 'bg-[#a73308]',
                          active ? 'ring-4 ring-sky-300 ring-offset-4' : '',
                          moveMode && active ? 'cursor-grab' : '',
                          draggingTableId === table.id ? 'cursor-grabbing scale-105' : '',
                        ].join(' ')}
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div className="text-center">
                          <p className="text-xl font-bold">{table.number}</p>
                          <p className="text-xs">{table.capacity} seats</p>
                          <p className="text-[10px] opacity-80">{resolveFloorName(table)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {moveMode
                    ? 'Select a table, then drag it on the floor map. Position saves automatically.'
                    : 'Select a table from the map or list, then enable moving to reposition it.'}
                </div>
              </div>
              {groupedTables
                .filter((entry) => selectedFloorId === 'ALL' || entry.floor.id === selectedFloorId)
                .map(({ floor, tables: floorTables }) => (
                  <section key={floor.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{floor.name}</h4>
                        <p className="text-sm text-slate-500">{floorTables.length} tables</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="ghost-btn small"
                          onClick={() => openCreateTableModal(floor.id)}
                        >
                          <Plus size={14} />
                          <span>{t('tables.createTable')}</span>
                        </button>
                        <button
                          type="button"
                          className="ghost-btn small"
                          onClick={() => openEditFloorModal(floor)}
                        >
                          <Pencil size={14} />
                          <span>{t('tables.edit')}</span>
                        </button>
                        <button
                          type="button"
                          className="ghost-btn small danger"
                          onClick={() => void handleDeleteFloor(floor)}
                        >
                          <Trash2 size={14} />
                          <span>{t('tables.delete')}</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {floorTables.length ? (
                        floorTables.map((table) => (
                          <div key={table.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h5 className="text-base font-bold text-slate-900">
                                  {t('tables.table')} {table.number}
                                </h5>
                                <p className="text-sm text-slate-500">
                                  {table.capacity} {t('tables.seats')}
                                </p>
                              </div>
                              <span className="badge">{statusLabel(table.status)}</span>
                            </div>

                            <button
                              type="button"
                              className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${
                                selectedLayoutTable?.id === table.id
                                  ? 'bg-sky-100 text-sky-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                              onClick={() => setSelectedLayoutTableId(table.id)}
                            >
                              {selectedLayoutTable?.id === table.id ? 'Selected on map' : 'Select on map'}
                            </button>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="ghost-btn small"
                                onClick={() => setQrPreviewTable(table)}
                              >
                                <Eye size={14} />
                                <span>{t('tables.viewQr')}</span>
                              </button>
                              <button
                                type="button"
                                className="ghost-btn small"
                                onClick={() => openEditTableModal(table)}
                              >
                                <Pencil size={14} />
                                <span>{t('tables.edit')}</span>
                              </button>
                              <button
                                type="button"
                                className="ghost-btn small danger"
                                onClick={() => void handleDeleteTable(table)}
                              >
                                <Trash2 size={14} />
                                <span>{t('tables.delete')}</span>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
                          No tables on this floor yet.
                        </div>
                      )}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </article>

        <aside className="space-y-6">
          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>{t('tables.gridView')}</h3>
                <p>{t('tables.totalTables')}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {visibleTables.map((table) => (
                <div key={table.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="block text-slate-900">
                        {t('tables.table')} {table.number}
                      </strong>
                      <span className="text-xs text-slate-500">
                        {resolveFloorName(table)} - {table.capacity} {t('tables.seats')}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{statusLabel(table.status)}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="ghost-btn small" onClick={() => downloadQr(table)}>
                      <Download size={14} />
                      <span>{t('tables.download')}</span>
                    </button>
                    <button type="button" className="ghost-btn small" onClick={() => printQr(table)}>
                      <Printer size={14} />
                      <span>{t('tables.print')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel compact-panel">
            <div className="panel-header">
              <div>
                <h3>{t('tables.restaurantScope')}</h3>
                <p>{t('tables.currentAdminContext')}</p>
              </div>
            </div>

            <div className="summary-stack">
              <div className="summary-row">
                <span>{t('common.restaurant')}</span>
                <strong>{restaurantName || t('common.restaurant')}</strong>
              </div>
              <div className="summary-row">
                <span>{t('tables.totalTables')}</span>
                <strong>{visibleTables.length}</strong>
              </div>
              <div className="summary-row">
                <span>Floors</span>
                <strong>{sortedFloors.length}</strong>
              </div>
              <div className="summary-row">
                <span>{t('tables.bulkPrint')}</span>
                <button type="button" className="ghost-btn small" onClick={() => printQr()}>
                  <Printer size={14} />
                  <span>{t('tables.printA4Sheet')}</span>
                </button>
              </div>
            </div>
          </article>
        </aside>
      </section>

      {showFloorModal ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <h3>{editingFloor ? t('tables.editTitle') : t('tables.createTitle')}</h3>
                <p>{editingFloor ? 'Rename this floor.' : 'Create a floor before adding its tables.'}</p>
              </div>
              <button type="button" className="icon-btn" onClick={closeFloorModal}>
                <X size={16} />
              </button>
            </div>

            <div className="form-stack">
              <input
                type="text"
                placeholder="Floor name"
                value={floorForm.name}
                onChange={(event) => setFloorForm({ name: event.target.value })}
              />

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={closeFloorModal}>
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => void handleSaveFloor()}
                  disabled={saving}
                >
                  <span>{saving ? t('common.saving') : editingFloor ? t('tables.edit') : 'Create Floor'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showTableModal ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <h3>
                  {editingTable
                    ? `${t('tables.editTitle')} ${editingTable.number}`
                    : t('tables.createTitle')}
                </h3>
                <p>{editingTable ? t('tables.editDescription') : t('tables.createDescription')}</p>
              </div>
              <button type="button" className="icon-btn" onClick={closeTableModal}>
                <X size={16} />
              </button>
            </div>

            <div className="form-stack">
              <select
                value={tableForm.floorId}
                onChange={(event) => setTableForm((current) => ({ ...current, floorId: event.target.value }))}
              >
                <option value="">Select floor</option>
                {sortedFloors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder={t('tables.number')}
                value={tableForm.number}
                onChange={(event) =>
                  setTableForm((current) => ({ ...current, number: event.target.value }))
                }
              />
              <input
                type="number"
                placeholder={t('tables.capacity')}
                value={tableForm.capacity}
                onChange={(event) =>
                  setTableForm((current) => ({ ...current, capacity: event.target.value }))
                }
              />
              <select
                value={tableForm.shape}
                onChange={(event) =>
                  setTableForm((current) => ({
                    ...current,
                    shape: event.target.value as 'round' | 'square',
                  }))
                }
              >
                <option value="round">Round</option>
                <option value="square">Square</option>
              </select>
              <select
                value={tableForm.status}
                onChange={(event) =>
                  setTableForm((current) => ({ ...current, status: event.target.value as TableStatus }))
                }
              >
                <option value="AVAILABLE">{statusLabel('AVAILABLE')}</option>
                <option value="OCCUPIED">{statusLabel('OCCUPIED')}</option>
                <option value="RESERVED">{statusLabel('RESERVED')}</option>
              </select>

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={closeTableModal}>
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => void handleSaveTable()}
                  disabled={saving}
                >
                  <span>
                    {saving
                      ? t('common.saving')
                      : editingTable
                        ? t('tables.editTitle')
                        : t('tables.createTable')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {qrPreviewTable ? (
        <div className="modal-backdrop">
          <div className="modal-card qr-modal">
            <div className="modal-head">
              <div>
                <h3>{t('tables.qrPreview')}</h3>
                <p>
                  {t('tables.table')} {qrPreviewTable.number} - {resolveFloorName(qrPreviewTable)}
                </p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setQrPreviewTable(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="qr-modal-body">
              <img
                src={qrPreviewTable.qrCodeUrl}
                alt={`QR ${t('tables.table')} ${qrPreviewTable.number}`}
                className="qr-modal-image"
              />
              <strong>{t('tables.scanToOrder')}</strong>
              <a className="qr-url" href={qrPreviewTable.qrPayload} target="_blank" rel="noreferrer">
                {qrPreviewTable.qrPayload}
              </a>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => downloadQr(qrPreviewTable)}>
                <Download size={14} />
                <span>{t('tables.downloadPng')}</span>
              </button>
              <button type="button" className="primary-btn" onClick={() => printQr(qrPreviewTable)}>
                <Printer size={14} />
                <span>{t('tables.printA4')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
