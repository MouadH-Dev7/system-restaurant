'use client';

import { memo } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import type { DiningTable } from '@/types/pos';
import type { PosDictionary } from '@/lib/i18n';
import { formatCountLabel } from '@/lib/i18n';

const tableTone = {
  available: 'bg-emerald-500 text-white',
  occupied: 'bg-emerald-600 text-white',
  reserved: 'bg-amber-500 text-white',
  preparing: 'bg-[#8a5a3b] text-white',
} as const;

type FloorPlanProps = {
  visibleTables: DiningTable[];
  selectedTableId: string | null;
  activeTable: DiningTable | undefined;
  moveMode: boolean;
  draggingTableId: string | null;
  zoom: number;
  positionOverrides: Record<string, { x: number; y: number }>;
  language: 'en' | 'fr' | 'ar';
  t: PosDictionary;
  mapRef: React.RefObject<HTMLDivElement | null>;
  onSelectTable: (tableId: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPointerMove: (clientX: number, clientY: number) => void;
  onPointerUp: () => void;
  onTablePointerDown: (tableId: string, clientX: number, clientY: number) => void;
  resolvePosition: (tableId: string, x: number, y: number) => { x: number; y: number };
};

export const FloorPlan = memo(function FloorPlan({
  visibleTables,
  selectedTableId,
  activeTable,
  moveMode,
  draggingTableId,
  zoom,
  positionOverrides,
  language,
  t,
  mapRef,
  onSelectTable,
  onZoomIn,
  onZoomOut,
  onPointerMove,
  onPointerUp,
  onTablePointerDown,
  resolvePosition,
}: FloorPlanProps) {
  return (
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
            onClick={onZoomIn}
            className="rounded-full border border-slate-200 bg-white p-3"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
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
        onPointerMove={(event) => onPointerMove(event.clientX, event.clientY)}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
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
                onSelectTable(table.id);
              }}
              onPointerDown={(event) => {
                if (!moveMode || table.id !== activeTable?.id) {
                  return;
                }

                event.preventDefault();
                onSelectTable(table.id);
                onTablePointerDown(table.id, event.clientX, event.clientY);
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
  );
});
