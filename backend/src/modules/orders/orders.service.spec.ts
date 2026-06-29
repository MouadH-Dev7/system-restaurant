import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';
import {
  CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE,
  CUSTOMER_ORDER_CANCEL_FORBIDDEN_MESSAGE,
  ORDER_PREPARATION_STARTED_MESSAGE,
  ORDER_VERSION_CONFLICT_MESSAGE,
  OrdersService,
  STAFF_ORDER_EDIT_FORBIDDEN_MESSAGE,
} from './orders.service';

function buildOrderRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    status: OrderStatus.PENDING,
    orderType: 'DINE_IN',
    total: 20,
    businessDate: new Date('2026-06-09T00:00:00.000Z'),
    dailyOrderNumber: 7,
    tableId: 'table-1',
    restaurantId: 'restaurant-1',
    guestSessionId: 'guest-session-1',
    source: 'CUSTOMER',
    version: 2,
    lockedAt: null,
    createdAt: new Date('2026-06-09T12:00:00.000Z'),
    lastModifiedAt: new Date('2026-06-09T12:00:00.000Z'),
    table: { id: 'table-1', number: 4 },
    items: [
      {
        id: 'line-1',
        quantity: 1,
        price: 20,
        notes: null,
        orderId: 'order-1',
        menuItemId: 'menu-item-1',
        modifiers: [],
        menuItem: {
          id: 'menu-item-1',
          name: 'Burger',
          nameEn: null,
          nameFr: null,
          nameAr: null,
          description: null,
          descriptionEn: null,
          descriptionFr: null,
          descriptionAr: null,
          price: 20,
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
        },
      },
    ],
    ...overrides,
  };
}

describe('OrdersService tenant isolation', () => {
  const prisma = {
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    table: {
      findFirst: jest.fn(),
    },
    orderItem: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const menuService = {
    validateMenuItems: jest.fn(),
  } as any;

  const printingService = {
    printKitchenTicketForOrder: jest.fn(),
    printKitchenModificationTicket: jest.fn(),
  } as any;

  const service = new OrdersService(
    prisma,
    { validateRestaurant: jest.fn() } as any,
    { validateTable: jest.fn() } as any,
    menuService,
    { publishOrderCreated: jest.fn(), publishStatusChange: jest.fn() } as any,
    { scheduleRefreshForRestaurant: jest.fn() } as any,
    {} as any,
    {} as any,
    printingService,
    { create: jest.fn() } as any,
    { record: jest.fn() } as any,
    { listModifierIngredients: jest.fn() } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    menuService.validateMenuItems.mockResolvedValue([
      {
        id: 'menu-item-1',
        name: 'Burger',
        price: 20,
        modifierGroups: [],
      },
    ]);
  });

  it('rejects staff item updates for orders outside their restaurant', async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(
      service.updateStaffOrderItems('order-1', 'restaurant-1', { items: [] as any }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects staff status updates for orders outside their restaurant', async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(
      service.updateStaffOrderStatus('order-1', 'restaurant-1', 'READY', UserRole.CHEF),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('OrdersService customer editing', () => {
  const prisma = {
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    table: {
      findFirst: jest.fn(),
    },
    orderItem: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const menuService = {
    validateMenuItems: jest.fn(),
  } as any;

  const printingService = {
    printKitchenModificationTicket: jest.fn().mockResolvedValue(null),
  } as any;

  const orderRealtimePublisher = {
    publishOrderCreated: jest.fn(),
    publishStatusChange: jest.fn(),
  } as any;

  const service = new OrdersService(
    prisma,
    { validateRestaurant: jest.fn() } as any,
    { validateTable: jest.fn() } as any,
    menuService,
    orderRealtimePublisher,
    { scheduleRefreshForRestaurant: jest.fn() } as any,
    {} as any,
    {} as any,
    printingService,
    { create: jest.fn() } as any,
    { record: jest.fn() } as any,
    { listModifierIngredients: jest.fn() } as any,
  );

  const updateInput = {
    version: 2,
    items: [{ menuItemId: 'menu-item-1', quantity: 2 }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.table.findFirst.mockResolvedValue({ id: 'table-1' });
    menuService.validateMenuItems.mockResolvedValue([
      {
        id: 'menu-item-1',
        name: 'Burger',
        price: 20,
        modifierGroups: [],
      },
    ]);
  });

  it('updates a pending customer order', async () => {
    const order = buildOrderRecord();
    const updatedOrder = buildOrderRecord({ version: 3, total: 40 });
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        order: {
          findUnique: jest.fn().mockResolvedValue({ version: 2, status: OrderStatus.PENDING }),
          update: jest.fn().mockResolvedValue(updatedOrder),
        },
        orderItem: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(tx);
    });

    const response = await service.updateCustomerOrderItems(
      'order-1',
      updateInput,
      'restaurant-1',
      'table-1',
      'guest-session-1',
    );

    expect(response.version).toBe(3);
    expect(printingService.printKitchenModificationTicket).toHaveBeenCalledTimes(1);
    expect(orderRealtimePublisher.publishOrderCreated).toHaveBeenCalled();
  });

  it('rejects customer edits when order is preparing', async () => {
    prisma.order.findUnique.mockResolvedValue(
      buildOrderRecord({ status: OrderStatus.PREPARING }),
    );

    await expect(
      service.updateCustomerOrderItems(
        'order-1',
        updateInput,
        'restaurant-1',
        'table-1',
        'guest-session-1',
      ),
    ).rejects.toThrow(ORDER_PREPARATION_STARTED_MESSAGE);
  });

  it('rejects customer edits for staff-created orders', async () => {
    prisma.order.findUnique.mockResolvedValue(buildOrderRecord({ source: 'STAFF' }));

    await expect(
      service.updateCustomerOrderItems(
        'order-1',
        updateInput,
        'restaurant-1',
        'table-1',
        'guest-session-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows customer to cancel own pending order', async () => {
    const order = buildOrderRecord();
    const cancelled = buildOrderRecord({ status: OrderStatus.CANCELLED });
    prisma.order.findUnique
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce(order);
    prisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        order: {
          update: jest.fn().mockResolvedValue(cancelled),
        },
      };
      return callback(tx);
    });

    const response = await service.cancelCustomerOrder(
      'order-1',
      'restaurant-1',
      'table-1',
      'guest-session-1',
    );

    expect(response.status).toBe(OrderStatus.CANCELLED);
  });

  it('rejects customer cancel after preparation starts', async () => {
    prisma.order.findUnique.mockResolvedValue(
      buildOrderRecord({ status: OrderStatus.PREPARING }),
    );

    await expect(
      service.cancelCustomerOrder(
        'order-1',
        'restaurant-1',
        'table-1',
        'guest-session-1',
      ),
    ).rejects.toThrow(CUSTOMER_ORDER_CANCEL_FORBIDDEN_MESSAGE);
  });

  it('rejects customer edits on version conflict', async () => {
    const staleOrder = buildOrderRecord({ version: 5 });
    prisma.order.findUnique.mockResolvedValue(staleOrder);

    await expect(
      service.updateCustomerOrderItems(
        'order-1',
        updateInput,
        'restaurant-1',
        'table-1',
        'guest-session-1',
      ),
    ).rejects.toThrow(ORDER_VERSION_CONFLICT_MESSAGE);
  });

  it('rejects customer edits with invalid table session', async () => {
    prisma.order.findUnique.mockResolvedValue(buildOrderRecord());

    await expect(
      service.updateCustomerOrderItems(
        'order-1',
        updateInput,
        'restaurant-1',
        'table-1',
        'other-guest-session',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects customer edits when guest session is missing', async () => {
    await expect(
      service.updateCustomerOrderItems(
        'order-1',
        updateInput,
        'restaurant-1',
        'table-1',
        undefined,
      ),
    ).rejects.toThrow(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
  });

  it('rejects customer edits when table does not belong to restaurant', async () => {
    prisma.table.findFirst.mockResolvedValue(null);

    await expect(
      service.updateCustomerOrderItems(
        'order-1',
        updateInput,
        'restaurant-1',
        'table-1',
        'guest-session-1',
      ),
    ).rejects.toThrow(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
  });

  it('lists only orders belonging to the active guest session', async () => {
    const sessionOrder = buildOrderRecord({ guestSessionId: 'guest-session-1' });
    prisma.order.findMany = jest.fn().mockResolvedValue([sessionOrder]);

    const result = await service.listRestaurantOrders({
      restaurantId: 'restaurant-1',
      tableId: 'table-1',
      guestSessionId: 'guest-session-1',
      scope: 'customer',
    });

    expect(result).toHaveLength(1);
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          restaurantId: 'restaurant-1',
          tableId: 'table-1',
          guestSessionId: 'guest-session-1',
        }),
      }),
    );
  });

  it('rejects customer order lookup across sessions', async () => {
    prisma.order.findUnique.mockResolvedValue(buildOrderRecord({ guestSessionId: 'guest-session-2' }));

    await expect(
      service.getCustomerOrderById(
        'order-1',
        'restaurant-1',
        'table-1',
        'guest-session-1',
      ),
    ).rejects.toThrow(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
  });

  it('rejects customer order lookup when guest session is missing', async () => {
    await expect(
      service.getCustomerOrderById(
        'order-1',
        'restaurant-1',
        'table-1',
        undefined,
      ),
    ).rejects.toThrow(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
  });

  it('rejects customer order listing when guest session is missing', async () => {
    await expect(
      service.listRestaurantOrders({
        restaurantId: 'restaurant-1',
        tableId: 'table-1',
        scope: 'customer',
      }),
    ).rejects.toThrow(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
  });
});

describe('OrdersService staff updates and printing', () => {
  const prisma = {
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    table: {
      findFirst: jest.fn(),
    },
    orderItem: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const menuService = {
    validateMenuItems: jest.fn(),
  } as any;

  const printingService = {
    printKitchenModificationTicket: jest.fn().mockResolvedValue(null),
    printKitchenTicketForOrder: jest.fn(),
  } as any;

  const orderRealtimePublisher = {
    publishOrderCreated: jest.fn(),
    publishStatusChange: jest.fn(),
  } as any;

  const service = new OrdersService(
    prisma,
    { validateRestaurant: jest.fn() } as any,
    { validateTable: jest.fn() } as any,
    menuService,
    orderRealtimePublisher,
    { scheduleRefreshForRestaurant: jest.fn() } as any,
    {} as any,
    {} as any,
    printingService,
    { create: jest.fn() } as any,
    { record: jest.fn() } as any,
    { listModifierIngredients: jest.fn() } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    menuService.validateMenuItems.mockResolvedValue([
      {
        id: 'menu-item-1',
        name: 'Burger',
        price: 20,
        modifierGroups: [],
      },
    ]);
  });

  it('rejects staff update when customer already changed the order version', async () => {
    const order = buildOrderRecord({ version: 4 });
    prisma.order.findFirst.mockResolvedValue(order);
    prisma.order.findUnique.mockResolvedValue(order);

    await expect(
      service.updateStaffOrderItems('order-1', 'restaurant-1', {
        version: 2,
        items: [{ menuItemId: 'menu-item-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prints modification tickets instead of full kitchen tickets on item updates', async () => {
    const order = buildOrderRecord({ version: 2 });
    const updatedOrder = buildOrderRecord({ version: 3, total: 40 });
    prisma.order.findFirst.mockResolvedValue(order);
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        order: {
          findUnique: jest.fn().mockResolvedValue({ version: 2, status: OrderStatus.PENDING }),
          update: jest.fn().mockResolvedValue(updatedOrder),
        },
        orderItem: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(tx);
    });

    await service.updateStaffOrderItems('order-1', 'restaurant-1', {
      version: 2,
      items: [{ menuItemId: 'menu-item-1', quantity: 2 }],
    });

    expect(printingService.printKitchenModificationTicket).toHaveBeenCalledTimes(1);
    expect(printingService.printKitchenTicketForOrder).not.toHaveBeenCalled();
    expect((service as any).auditTrailService.record).toHaveBeenCalled();
  });

  it('requires a reason for staff edits after kitchen processing started', async () => {
    const preparingOrder = buildOrderRecord({ version: 2, status: OrderStatus.PREPARING });
    prisma.order.findFirst.mockResolvedValue(preparingOrder);
    prisma.order.findUnique.mockResolvedValue(preparingOrder);

    await expect(
      service.updateStaffOrderItems('order-1', 'restaurant-1', {
        version: 2,
        items: [{ menuItemId: 'menu-item-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not notify or print kitchen updates for cashier edits after preparation started', async () => {
    const deliveredOrder = buildOrderRecord({ version: 2, status: OrderStatus.DELIVERED, total: 40 });
    const updatedDeliveredOrder = buildOrderRecord({ version: 3, status: OrderStatus.DELIVERED, total: 55 });
    prisma.order.findFirst.mockResolvedValue(deliveredOrder);
    prisma.order.findUnique.mockResolvedValue(deliveredOrder);
    prisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        order: {
          findUnique: jest.fn().mockResolvedValue({ version: 2, status: OrderStatus.DELIVERED }),
          update: jest.fn().mockResolvedValue(updatedDeliveredOrder),
        },
        orderItem: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(tx);
    });

    await service.updateStaffOrderItems(
      'order-1',
      'restaurant-1',
      {
        version: 2,
        reason: 'Cashier corrected payable items',
        items: [{ menuItemId: 'menu-item-1', quantity: 2 }],
      },
      {
        sub: 'cashier-1',
        name: 'Cashier',
        role: UserRole.CASHIER,
        restaurantId: 'restaurant-1',
        email: 'cashier@example.com',
        staffCode: 'C1',
        sessionId: 's1',
        isActive: true,
      },
    );

    expect(orderRealtimePublisher.publishOrderCreated).not.toHaveBeenCalled();
    expect(printingService.printKitchenModificationTicket).not.toHaveBeenCalled();
  });

  it('rejects staff edits for customer-created orders', async () => {
    const customerOrder = buildOrderRecord({ source: 'CUSTOMER' });
    prisma.order.findFirst.mockResolvedValue(customerOrder);

    await expect(
      service.updateStaffOrderItems('order-1', 'restaurant-1', {
        version: 2,
        items: [{ menuItemId: 'menu-item-1', quantity: 1 }],
      }),
    ).rejects.toThrow(STAFF_ORDER_EDIT_FORBIDDEN_MESSAGE);
  });

  it('rejects staff edits after preparation starts', async () => {
    const staffPreparingOrder = buildOrderRecord({ source: 'STAFF', status: OrderStatus.PREPARING });
    prisma.order.findFirst.mockResolvedValue(staffPreparingOrder);

    await expect(
      service.updateStaffOrderItems('order-1', 'restaurant-1', {
        version: 2,
        items: [{ menuItemId: 'menu-item-1', quantity: 1 }],
      }),
    ).rejects.toThrow(STAFF_ORDER_EDIT_FORBIDDEN_MESSAGE);
  });

  it('does not print when modification ticket has no item changes', async () => {
    const order = buildOrderRecord({ version: 2 });
    prisma.order.findFirst.mockResolvedValue(order);
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        order: {
          findUnique: jest.fn().mockResolvedValue({ version: 2, status: OrderStatus.PENDING }),
          update: jest.fn().mockResolvedValue(order),
        },
        orderItem: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(tx);
    });

    await service.updateStaffOrderItems('order-1', 'restaurant-1', {
      version: 2,
      items: [{ menuItemId: 'menu-item-1', quantity: 1 }],
    });

    expect(printingService.printKitchenModificationTicket).toHaveBeenCalledTimes(1);
  });

  it('persists payment method when cashier marks an order as paid', async () => {
    const deliveredOrder = buildOrderRecord({ status: OrderStatus.DELIVERED, total: 40 });
    const paidOrder = buildOrderRecord({ status: OrderStatus.PAID, total: 40 });
    prisma.order.findFirst.mockResolvedValue(deliveredOrder);
    prisma.order.findUnique.mockResolvedValue(deliveredOrder);
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        order: {
          update: jest.fn().mockResolvedValue(paidOrder),
        },
        payment: {
          findUnique: jest.fn().mockResolvedValue(null),
          upsert: jest.fn().mockResolvedValue({
            id: 'payment-1',
            method: 'BANK_TRANSFER',
            amount: 40,
            status: 'COMPLETED',
          }),
        },
      };
      return callback(tx);
    });

    await service.updateStaffOrderStatus(
      'order-1',
      'restaurant-1',
      'PAID',
      UserRole.CASHIER,
      {
        sub: 'user-1',
        name: 'Cashier',
        role: UserRole.CASHIER,
        restaurantId: 'restaurant-1',
        email: 'cashier@example.com',
        staffCode: 'C1',
        sessionId: 's1',
        isActive: true,
      },
      'Payment received from customer',
    );

    expect((service as any).auditTrailService.record).toHaveBeenCalled();
  });

  it('requires a reason when cancelling an order', async () => {
    const deliveredOrder = buildOrderRecord({ status: OrderStatus.DELIVERED, total: 40 });
    prisma.order.findFirst.mockResolvedValue(deliveredOrder);
    prisma.order.findUnique.mockResolvedValue(deliveredOrder);

    await expect(
      service.updateStaffOrderStatus(
        'order-1',
        'restaurant-1',
        'CANCELLED',
        UserRole.CASHIER,
        {
          sub: 'user-1',
          name: 'Cashier',
          role: UserRole.CASHIER,
          restaurantId: 'restaurant-1',
          email: 'cashier@example.com',
          staffCode: 'C1',
          sessionId: 's1',
          isActive: true,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
