import { OrderType, type MenuItemDTO, type OrderItemDTO, type OrderResponse } from '@repo/shared-types';
import { generateOrderModificationTicket } from './order-modification-ticket';

function buildItem(
  overrides: Partial<OrderItemDTO> & Pick<OrderItemDTO, 'menuItemId' | 'quantity'>,
): OrderItemDTO {
  const menuItem = overrides.menuItem as MenuItemDTO | undefined;
  const menuItemName = (overrides.menuItem as { name?: string } | undefined)?.name;

  return {
    id: overrides.id ?? `item-${overrides.menuItemId}`,
    price: overrides.price ?? 10,
    notes: overrides.notes ?? null,
    orderId: overrides.orderId ?? 'order-1',
    menuItemId: overrides.menuItemId,
    quantity: overrides.quantity,
    modifiers: overrides.modifiers,
    menuItem: (menuItem ?? {
      id: overrides.menuItemId,
      name: menuItemName ?? overrides.menuItemId,
      description: null,
      descriptionEn: null,
      descriptionFr: null,
      descriptionAr: null,
      nameEn: null,
      nameFr: null,
      nameAr: null,
      price: 10,
      image: null,
      available: true,
      featured: false,
      badge: null,
      badgeEn: null,
      badgeFr: null,
      badgeAr: null,
      sortOrder: 0,
      menuId: 'menu-1',
      restaurantId: 'restaurant-1',
    }) as MenuItemDTO,
  };
}

function buildOrder(items: OrderItemDTO[], dailyOrderNumber = 105): OrderResponse {
  return {
    id: 'order-1',
    status: 'PENDING',
    orderType: OrderType.DINE_IN,
    source: 'CUSTOMER',
    total: 100,
    subtotal: 100,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 100,
    paidAmount: 0,
    remainingAmount: 100,
    financialStatus: 'UNPAID',
    financialSummary: {
      subtotal: 100,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 100,
      paidAmount: 0,
      remainingAmount: 100,
      financialStatus: 'UNPAID',
    },
    businessDate: '2026-06-09T00:00:00.000Z',
    dailyOrderNumber,
    tableId: 'table-1',
    restaurantId: 'restaurant-1',
    guestSessionId: 'guest-1',
    version: 1,
    lockedAt: null,
    parentOrderId: null,
    serviceTimes: {
      createdAt: '2026-06-09T12:00:00.000Z',
      acceptedAt: null,
      preparationStartedAt: null,
      readyAt: null,
      deliveredAt: null,
    },
    table: { id: 'table-1', number: 4 },
    items,
    createdAt: '2026-06-09T12:00:00.000Z',
    lastModifiedAt: '2026-06-09T12:00:00.000Z',
  };
}

describe('generateOrderModificationTicket', () => {
  it('builds added, removed, and changed sections', () => {
    const oldOrder = buildOrder([
      buildItem({ menuItemId: 'burger', quantity: 1, menuItem: { id: 'burger', name: 'Burger' } as any }),
      buildItem({ menuItemId: 'salad', quantity: 1, menuItem: { id: 'salad', name: 'Salad' } as any }),
      buildItem({ menuItemId: 'pizza', quantity: 1, menuItem: { id: 'pizza', name: 'Pizza' } as any }),
    ]);

    const newOrder = buildOrder([
      buildItem({ menuItemId: 'burger', quantity: 1, menuItem: { id: 'burger', name: 'Burger' } as any }),
      buildItem({ menuItemId: 'cola', quantity: 2, menuItem: { id: 'cola', name: 'Cola' } as any }),
      buildItem({ menuItemId: 'pizza', quantity: 2, menuItem: { id: 'pizza', name: 'Pizza' } as any }),
    ]);

    const ticket = generateOrderModificationTicket(oldOrder, newOrder);

    expect(ticket).not.toBeNull();
    expect(ticket?.title).toBe('ORDER UPDATE');
    expect(ticket?.lines).toEqual(
      expect.arrayContaining([
        'ORDER UPDATE #105',
        'Table 4',
        'Added:',
        '+ Cola x2',
        'Removed:',
        '- Salad x1',
        'Changed:',
        'Pizza x1 -> Pizza x2',
      ]),
    );
  });

  it('returns null when there are no item changes', () => {
    const items = [
      buildItem({ menuItemId: 'burger', quantity: 1, menuItem: { id: 'burger', name: 'Burger' } as any }),
    ];
    const order = buildOrder(items);

    expect(generateOrderModificationTicket(order, buildOrder([...items]))).toBeNull();
  });
});
