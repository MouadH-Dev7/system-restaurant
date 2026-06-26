import type { OrderResponse, TableDTO, TableStatus as ApiTableStatus } from '@repo/shared-types';
import { isWalkInOrder } from '@repo/shared-types';
import { orderToTableSummary } from '@/lib/mappers/order.mapper';
import { localizeAreaName } from '@/lib/i18n';
import type { PosLanguage } from '@/store/pos-ui.store';
import type { DiningTable } from '@/types/pos';

function mapTableStatus(status: ApiTableStatus, hasActiveOrder: boolean): DiningTable['status'] {
  if (hasActiveOrder) {
    return 'preparing';
  }

  switch (status) {
    case 'AVAILABLE':
      return 'available';
    case 'OCCUPIED':
      return 'occupied';
    case 'RESERVED':
      return 'reserved';
    default:
      return 'available';
  }
}

function computeTableLayout(count: number, index: number) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = 10 + ((col + 0.5) / cols) * 80;
  const y = 10 + ((row + 0.5) / rows) * 72;
  const areas = ['main-hall', 'window', 'bar'] as const;
  return {
    x,
    y,
    shape: (index % 2 === 0 ? 'round' : 'square') as 'round' | 'square',
    area: areas[row % areas.length] ?? 'main-hall',
  };
}

function normalizeCoordinate(
  value: number | null,
  fallback: number,
  axis: 'x' | 'y',
) {
  if (value === null || Number.isNaN(value)) {
    return fallback;
  }

  // Support legacy ratios like 0.15 as well as normal percentages like 15.
  const normalized = value > 0 && value <= 1 ? value * 100 : value;
  const min = axis === 'x' ? 8 : 10;
  const max = axis === 'x' ? 92 : 82;

  if (normalized < min || normalized > max) {
    return fallback;
  }

  return normalized;
}

export function mapTablesToFloorPlan(
  tables: TableDTO[],
  orders: OrderResponse[],
  language: PosLanguage,
): DiningTable[] {
  const activeByTable = new Map<string, OrderResponse[]>();

  for (const order of orders) {
    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      continue;
    }

    if (isWalkInOrder(order)) {
      continue;
    }

    const list = activeByTable.get(order.tableId) ?? [];
    list.push(order);
    activeByTable.set(order.tableId, list);
  }

  const floorTables = tables.slice().sort((a, b) => a.number - b.number);

  return floorTables.map((table, index) => {
    const generatedLayout = computeTableLayout(floorTables.length, index);
    const layout = {
      x: normalizeCoordinate(table.posX, generatedLayout.x, 'x'),
      y: normalizeCoordinate(table.posY, generatedLayout.y, 'y'),
      shape: table.shape ?? generatedLayout.shape,
      area: table.floorName ? 'main-hall' : generatedLayout.area,
    };
    const tableOrders = (activeByTable.get(table.id) ?? [])
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const summaries = tableOrders.map((order) => orderToTableSummary(order, language, tableOrders));
    const grandTotalAmount = summaries.reduce((sum, item) => sum + item.grandTotal, 0);
    const paidAmount = summaries.reduce((sum, item) => sum + item.paidAmount, 0);
    const remainingAmount = summaries.reduce((sum, item) => sum + item.remainingAmount, 0);

    return {
      id: table.id,
      label: String(table.number),
      seats: table.capacity,
      floorId: table.floorId,
      floorName: table.floorName ?? 'Main Floor',
      area: localizeAreaName(layout.area, language),
      x: layout.x,
      y: layout.y,
      shape: layout.shape,
      status: mapTableStatus(table.status, summaries.length > 0),
      activeOrders: summaries,
      orderCount: summaries.length,
      grandTotalAmount,
      paidAmount,
      remainingAmount,
    };
  });
}

export function getOrdersForTable(
  orders: OrderResponse[],
  tableId: string,
  language: PosLanguage,
) {
  return orders
    .filter(
      (order) =>
        order.tableId === tableId && order.status !== 'PAID' && order.status !== 'CANCELLED',
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((order) => orderToTableSummary(order, language, orders));
}
