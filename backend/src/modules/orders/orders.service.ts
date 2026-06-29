import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLogModule,
  AuditLogStatus,
  ConsumptionType,
  DiscountApprovalStatus,
  DiscountType,
  OrderSource,
  OrderStatus,
  OrderType as PrismaOrderType,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import type {
  CartItemDTO,
  MenuItemDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
  OrderFinancialSummaryDTO,
  OrderSource as SharedOrderSource,
  TableOrdersGroupDTO,
  OrderType,
  OrderResponse,
  OrderStatus as SharedOrderStatus,
} from '@repo/shared-types';
import { OrderRealtimePublisher } from '../../realtime/order-realtime.publisher';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { DiscountsService } from '../discounts/discounts.service';
import { MenuService } from '../menu/menu.service';
import { PaymentsService } from '../payments/payments.service';
import { ModifierIngredientsService } from '../modifier-ingredients/modifier-ingredients.service';
import { PrintingService } from '../printing/printing.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { TablesService } from '../tables/tables.service';
import { WaiterNotificationsService } from '../tables/waiter-notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import type { RestaurantOrdersQueryDto } from './dto/restaurant-orders-query.dto';
import { UpdateOrderItemsDto } from './dto/update-order-items.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditTrailService } from '../logs/audit-trail.service';

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    table: { select: { id: true; number: true } };
    items: {
      select: {
        id: true;
        quantity: true;
        price: true;
        notes: true;
        menuItemId: true;
        orderId: true;
        modifiers: {
          select: {
            id: true;
            modifierOptionId: true;
            groupName: true;
            groupNameEn: true;
            groupNameFr: true;
            groupNameAr: true;
            optionName: true;
            optionNameEn: true;
            optionNameFr: true;
            optionNameAr: true;
            priceDelta: true;
          };
        };
        menuItem: {
          select: {
            id: true;
            name: true;
            nameEn: true;
            nameFr: true;
            nameAr: true;
            description: true;
            descriptionEn: true;
            descriptionFr: true;
            descriptionAr: true;
            price: true;
            image: true;
            available: true;
            featured: true;
            badge: true;
            badgeEn: true;
            badgeFr: true;
            badgeAr: true;
            sortOrder: true;
            menuId: true;
            restaurantId: true;
          };
        };
      };
    };
  };
}>;

type ResolvedItemSelection = {
  cartItem: CartItemDTO;
  menuItem: MenuItemDTO;
  unitPrice: number;
  totalPrice: number;
  modifiers: Array<{
    modifierOptionId: string;
    groupName: string;
    groupNameEn?: string | null;
    groupNameFr?: string | null;
    groupNameAr?: string | null;
    optionName: string;
    optionNameEn?: string | null;
    optionNameFr?: string | null;
    optionNameAr?: string | null;
    priceDelta: number;
  }>;
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [OrderStatus.PAID],
  PAID: [],
  CANCELLED: [],
};

const KITCHEN_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

const POS_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERED,
];

const CUSTOMER_ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERED,
];

const STAFF_EDITABLE_STATUSES: OrderStatus[] = [OrderStatus.PENDING];
const STAFF_LOCKED_STATUSES: OrderStatus[] = [
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERED,
];

const BUSINESS_TIME_ZONE = 'Africa/Algiers';
const ORDER_NUMBER_RETRY_LIMIT = 3;

export const ORDER_VERSION_CONFLICT_MESSAGE = 'Order has been modified by another user';
export const ORDER_PREPARATION_STARTED_MESSAGE =
  'Order preparation has already started. This order can no longer be modified.';
export const CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE = 'Invalid table session';
export const STAFF_ORDER_EDIT_FORBIDDEN_MESSAGE =
  'Staff can only edit pending orders before kitchen preparation starts.';
export const CASHIER_ORDER_EDIT_FORBIDDEN_MESSAGE =
  'Cashier can only edit orders before kitchen preparation starts or during payment.';
export const CUSTOMER_ORDER_CANCEL_FORBIDDEN_MESSAGE =
  'Customer can only cancel their order before kitchen preparation starts.';

type UpdateOrderItemsOptions = {
  expectedVersion?: number;
  requirePending?: boolean;
  actor?: AuthenticatedUser;
  reason?: string;
  sourceContext?: string;
  suppressKitchenPrint?: boolean;
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly restaurantsService: RestaurantsService,
    private readonly tablesService: TablesService,
    private readonly menuService: MenuService,
    private readonly orderRealtimePublisher: OrderRealtimePublisher,
    private readonly analyticsService: AnalyticsService,
    private readonly paymentsService: PaymentsService,
    private readonly discountsService: DiscountsService,
    @Inject(forwardRef(() => PrintingService))
    private readonly printingService: PrintingService,
    private readonly waiterNotificationsService: WaiterNotificationsService,
    private readonly auditTrailService: AuditTrailService,
    private readonly modifierIngredientsService: ModifierIngredientsService,
  ) {}

  async createOrder(
    input: CreateOrderDto,
    actor?: AuthenticatedUser,
    parentOrderId?: string | null,
  ): Promise<OrderResponse> {
    if (input.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    await this.restaurantsService.validateRestaurant(input.restaurantId);
    const orderType = this.resolveOrderType(input.orderType, input.tableId);
    const isWalkInOrder = orderType === PrismaOrderType.TAKEAWAY;
    const resolvedTableId = isWalkInOrder ? null : input.tableId ?? null;

    if (!isWalkInOrder) {
      if (!input.tableId) {
        throw new BadRequestException('tableId is required for dine-in orders');
      }

      await this.tablesService.validateTable(input.tableId, input.restaurantId);
    }

    const selections = await this.resolveSelections(input.items, input.restaurantId);
    const total = selections.reduce((sum, item) => sum + item.totalPrice, 0);
    const order = await this.createOrderWithDailyNumber({
      restaurantId: input.restaurantId,
      tableId: resolvedTableId,
      parentOrderId: parentOrderId ?? null,
      guestSessionId: input.guestSessionId,
      source: actor ? OrderSource.STAFF : OrderSource.CUSTOMER,
      orderType,
      total,
      selections,
    });

    await this.auditTrailService.record({
      actor: {
        restaurantId: input.restaurantId,
        userId: actor?.sub ?? null,
        userName: actor?.name ?? (input.guestSessionId ? `Guest ${input.guestSessionId}` : 'Customer'),
        role: actor?.role ?? 'CUSTOMER',
      },
      module: AuditLogModule.ORDERS,
      action: 'ORDER_CREATED',
      actionType: 'CREATE_ORDER',
      entityType: 'ORDER',
      entityId: order.id,
      after: await this.toOrderResponse(order),
      details: {
        orderId: order.id,
        dailyOrderNumber: order.dailyOrderNumber,
        tableId: order.tableId,
        tableNumber: order.table?.number ?? null,
        orderType: order.orderType,
      },
    });

    const response = await this.toOrderResponse(order);
    await this.orderRealtimePublisher.publishOrderCreated(response);
    await this.analyticsService.scheduleRefreshForRestaurant(response.restaurantId);

    try {
      await this.printingService.printKitchenTicketForOrder(response);
    } catch (error) {
      this.logger.warn(
        `Kitchen ticket printing failed for order ${response.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return response;
  }

  async createStaffOrder(
    user: AuthenticatedUser,
    input: Omit<CreateOrderDto, 'restaurantId'>,
  ): Promise<OrderResponse> {
    const parentOrderId = await this.resolveParentOrderIdForStaffOrder(
      user.restaurantId,
      input.tableId,
    );

    return this.createOrder({
      ...input,
      restaurantId: user.restaurantId,
    }, user, parentOrderId);
  }

  async listRestaurantOrders(query: RestaurantOrdersQueryDto): Promise<OrderResponse[] | TableOrdersGroupDTO[]> {
    const { restaurantId, scope = 'kitchen', tableId, guestSessionId, view = 'list', includeHistory } = query;
    if (scope === 'customer') {
      this.assertCustomerReadContext(restaurantId, tableId);
      const scopedRestaurantId = restaurantId!;
      const scopedTableId = tableId!;
      await this.assertCustomerTableAccess(scopedRestaurantId, scopedTableId);

      const orders = await this.prisma.order.findMany({
        where: {
          restaurantId: scopedRestaurantId,
          tableId: scopedTableId,
          status: { in: CUSTOMER_ACTIVE_STATUSES },
        },
        include: this.orderInclude,
        orderBy: { createdAt: 'asc' },
        take: 300,
      });

      const responses = await this.respondWithBulkFinancials(orders, scopedRestaurantId);
      return view === 'table' ? this.groupOrdersByTable(responses) : responses;
    }

    await this.restaurantsService.validateRestaurant(restaurantId);
    const statuses = scope === 'pos' ? POS_STATUSES : KITCHEN_STATUSES;
    const currentBusinessDate = new Date(`${this.getBusinessDateKey(new Date())}T00:00:00.000Z`);
    const where =
      includeHistory === 'today' && scope === 'pos'
        ? {
            restaurantId,
            businessDate: currentBusinessDate,
          }
        : {
            restaurantId,
            status: { in: statuses },
          };

    const orders = await this.prisma.order.findMany({
      where,
      include: this.orderInclude,
      orderBy: { createdAt: 'asc' },
      take: 300,
    });

    const responses = await this.respondWithBulkFinancials(orders, restaurantId);
    return view === 'table' ? this.groupOrdersByTable(responses) : responses;
  }

  async listStaffOrders(
    user: AuthenticatedUser,
    scope: 'kitchen' | 'pos' = 'kitchen',
    view: 'list' | 'table' = 'list',
    includeHistory?: 'today',
  ): Promise<OrderResponse[] | TableOrdersGroupDTO[]> {
    return this.listRestaurantOrders({
      restaurantId: user.restaurantId,
      scope,
      view,
      includeHistory,
    });
  }

  async getOrderById(
    orderId: string,
    restaurantId: string,
    tableId?: string,
  ): Promise<OrderResponse> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId,
        ...(tableId ? { tableId } : {}),
      },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toOrderResponse(order);
  }

  async getCustomerOrderById(
    orderId: string,
    restaurantId?: string,
    tableId?: string,
    guestSessionId?: string,
  ): Promise<OrderResponse> {
    this.assertCustomerReadContext(restaurantId, tableId);
    const scopedRestaurantId = restaurantId!;
    const scopedTableId = tableId!;
    await this.assertCustomerTableAccess(scopedRestaurantId, scopedTableId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.restaurantId !== scopedRestaurantId ||
      order.tableId !== scopedTableId
    ) {
      throw new ForbiddenException(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
    }

    return this.toOrderResponse(order);
  }

  async updateOrderItems(
    orderId: string,
    input: UpdateOrderItemsDto,
    options: UpdateOrderItemsOptions = {},
  ): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousResponse = await this.toOrderResponse(order);
    const shouldSyncKitchenUpdate = order.status === OrderStatus.PENDING;
    const shouldPrintKitchenUpdate = shouldSyncKitchenUpdate && !options.suppressKitchenPrint;

    const allowHistoryEdit = options.sourceContext === 'history';

    if (!allowHistoryEdit && (order.status === OrderStatus.PAID || order.status === OrderStatus.CANCELLED)) {
      throw new ConflictException('Cannot edit a closed order');
    }

      if (options.requirePending && order.status !== OrderStatus.PENDING) {
        throw new ConflictException(ORDER_PREPARATION_STARTED_MESSAGE);
      }

      if (!options.requirePending && order.status !== OrderStatus.PENDING && !input.reason?.trim()) {
        throw new BadRequestException('Reason is required for edits after the order is sent to the kitchen');
      }

    if (
      options.expectedVersion !== undefined &&
      order.version !== options.expectedVersion
    ) {
      throw new ConflictException(ORDER_VERSION_CONFLICT_MESSAGE);
    }

    const selections = await this.resolveSelections(input.items, order.restaurantId);
    const total = selections.reduce((sum, item) => sum + item.totalPrice, 0);

    let updatedOrder: OrderWithItems;

    try {
      updatedOrder = await this.prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({
          where: { id: orderId },
          select: { version: true, status: true },
        });

        if (!current) {
          throw new NotFoundException('Order not found');
        }

        if (options.requirePending && current.status !== OrderStatus.PENDING) {
          throw new ConflictException(ORDER_PREPARATION_STARTED_MESSAGE);
        }

        if (
          options.expectedVersion !== undefined &&
          current.version !== options.expectedVersion
        ) {
          throw new ConflictException(ORDER_VERSION_CONFLICT_MESSAGE);
        }

        await tx.orderItem.deleteMany({ where: { orderId } });

        return tx.order.update({
          where: { id: orderId, version: current.version },
          data: {
            version: { increment: 1 },
            total,
            items: {
              create: selections.map((selection) => ({
                menuItemId: selection.menuItem.id,
                quantity: selection.cartItem.quantity,
                price: selection.unitPrice,
                notes: selection.cartItem.notes,
                modifiers: selection.modifiers.length
                  ? {
                      create: selection.modifiers.map((modifier) => ({
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
                    }
                  : undefined,
              })),
            },
          },
          include: this.orderInclude,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ConflictException(ORDER_VERSION_CONFLICT_MESSAGE);
      }

      throw error;
    }

    const response = await this.toOrderResponse(updatedOrder);
    await this.logOrderAudit(
      order,
      response,
      options.actor,
      'ORDER_ITEMS_UPDATED',
      input.reason,
      options.sourceContext ?? input.sourceContext,
    );
    if (shouldSyncKitchenUpdate) {
      await this.orderRealtimePublisher.publishOrderCreated(response);
    }
    await this.analyticsService.scheduleRefreshForRestaurant(response.restaurantId);

    if (shouldPrintKitchenUpdate) {
      try {
        await this.printingService.printKitchenModificationTicket(previousResponse, response);
      } catch (error) {
        this.logger.warn(
          `Kitchen modification ticket failed for order ${response.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return response;
  }

  async updateStaffOrderItems(
    orderId: string,
    restaurantId: string,
    input: UpdateOrderItemsDto,
    actor?: AuthenticatedUser,
  ): Promise<OrderResponse> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const allowHistoryEdit = input.sourceContext === 'history' && actor?.role === UserRole.CASHIER;

    if (!allowHistoryEdit && (order.status === OrderStatus.PAID || order.status === OrderStatus.CANCELLED)) {
      throw new ConflictException(STAFF_ORDER_EDIT_FORBIDDEN_MESSAGE);
    }

    const canCashierEditStatus =
      allowHistoryEdit || order.status === OrderStatus.PENDING || order.status === OrderStatus.DELIVERED;
    const canEditAnyOpenOrder =
      actor?.role === UserRole.ADMIN ||
      actor?.role === UserRole.MANAGER;

    if (actor?.role === UserRole.CASHIER && !canCashierEditStatus) {
      throw new ConflictException(CASHIER_ORDER_EDIT_FORBIDDEN_MESSAGE);
    }

    return this.updateOrderItems(orderId, input, {
      expectedVersion: input.version,
      requirePending:
        actor?.role === UserRole.CASHIER
          ? allowHistoryEdit
            ? false
            : order.status === OrderStatus.PENDING
          : canEditAnyOpenOrder
            ? false
            : true,
      actor,
      reason: input.reason,
      sourceContext: input.sourceContext,
      suppressKitchenPrint: canEditAnyOpenOrder || actor?.role === UserRole.CASHIER,
    });
  }

  async updateCustomerOrderItems(
    orderId: string,
    input: UpdateOrderItemsDto,
    restaurantId?: string,
    tableId?: string,
    guestSessionId?: string,
  ): Promise<OrderResponse> {
    this.assertCustomerAccessContext(restaurantId, tableId, guestSessionId);
    const scopedRestaurantId = restaurantId!;
    const scopedTableId = tableId!;
    const scopedGuestSessionId = guestSessionId!;
    await this.assertCustomerTableAccess(scopedRestaurantId, scopedTableId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (input.version === undefined) {
      throw new ForbiddenException(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
    }

    if (
      order.restaurantId !== scopedRestaurantId ||
      order.tableId !== scopedTableId ||
      order.guestSessionId !== scopedGuestSessionId ||
      order.source !== OrderSource.CUSTOMER
    ) {
      throw new ForbiddenException(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(ORDER_PREPARATION_STARTED_MESSAGE);
    }

    return this.updateOrderItems(orderId, input, {
      expectedVersion: input.version,
      requirePending: true,
    });
  }

  async cancelCustomerOrder(
    orderId: string,
    restaurantId?: string,
    tableId?: string,
    guestSessionId?: string,
  ): Promise<OrderResponse> {
    this.assertCustomerAccessContext(restaurantId, tableId, guestSessionId);
    const scopedRestaurantId = restaurantId!;
    const scopedTableId = tableId!;
    const scopedGuestSessionId = guestSessionId!;
    await this.assertCustomerTableAccess(scopedRestaurantId, scopedTableId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.restaurantId !== scopedRestaurantId ||
      order.tableId !== scopedTableId ||
      order.guestSessionId !== scopedGuestSessionId ||
      order.source !== OrderSource.CUSTOMER
    ) {
      throw new ForbiddenException(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(CUSTOMER_ORDER_CANCEL_FORBIDDEN_MESSAGE);
    }

    return this.updateOrderStatus(
      orderId,
      OrderStatus.CANCELLED,
      'Cancelled by customer before kitchen preparation started',
    );
  }

  async updateOrderStatus(
    orderId: string,
    status: SharedOrderStatus,
    reason?: string,
    actor?: AuthenticatedUser,
  ): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (status === OrderStatus.CANCELLED && !reason?.trim()) {
      throw new BadRequestException('Reason is required for this sensitive order action');
    }

    if (!this.canTransition(order.status, status)) {
      throw new ConflictException(`Cannot transition order from ${order.status} to ${status}`);
    }

    const previousStatus = order.status;
    const statusTimestampUpdate =
      status === OrderStatus.PREPARING
        ? { preparationStartedAt: new Date() }
        : status === OrderStatus.READY
          ? { readyAt: new Date() }
          : status === OrderStatus.DELIVERED
            ? { deliveredAt: new Date() }
            : {};

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: orderId, version: order.version },
        data: {
          status,
          version: { increment: 1 },
          ...statusTimestampUpdate,
          ...(previousStatus === OrderStatus.PENDING && status !== OrderStatus.PENDING
            ? { lockedAt: new Date() }
            : {}),
        } as any,
        include: this.orderInclude,
      });

      return next;
    }).catch((error) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ConflictException(ORDER_VERSION_CONFLICT_MESSAGE);
      }

      throw error;
    });

    const response = await this.toOrderResponse(updatedOrder);
    if (status === OrderStatus.PREPARING) {
      await this.depleteInventoryForOrder(updatedOrder);
      await this.depleteModifierIngredientsForOrder(updatedOrder);
    }
    if (status === OrderStatus.PAID) {
      await this.auditTrailService.record({
        actor: {
          restaurantId: response.restaurantId,
          userId: actor?.sub ?? null,
          userName: actor?.name ?? 'System',
          role: actor?.role ?? 'SYSTEM',
          staffCode: actor?.staffCode ?? null,
          sessionId: actor?.sessionId ?? null,
        },
        module: AuditLogModule.ORDERS,
        action: 'ORDER_PAYMENT',
        actionType: 'ORDER_PAYMENT',
        entityType: 'ORDER',
        entityId: response.id,
        reason,
        after: {
          orderId: response.id,
          dailyOrderNumber: response.dailyOrderNumber,
          financialStatus: response.financialStatus,
          paidAmount: response.paidAmount,
          remainingAmount: response.remainingAmount,
        },
        details: {
          orderId: response.id,
          dailyOrderNumber: response.dailyOrderNumber,
          tableId: response.tableId,
          tableNumber: response.table?.number ?? null,
          paidAmount: response.paidAmount,
          remainingAmount: response.remainingAmount,
          financialStatus: response.financialStatus,
        },
        context: {
          ipAddress: actor?.ipAddress,
          userAgent: actor?.userAgent,
        },
      });
    }
    await this.orderRealtimePublisher.publishStatusChange(previousStatus, response);
    await this.analyticsService.scheduleRefreshForRestaurant(response.restaurantId);

    if (status === OrderStatus.READY) {
      const notificationMetadata = {
        dailyOrderNumber: response.dailyOrderNumber,
        displayOrderId: response.displayOrderId,
        orderStatus: response.status,
        totalItems: response.items.reduce((sum, item) => sum + item.quantity, 0),
        items: response.items.map((item) => ({
          quantity: item.quantity,
          name: item.menuItem?.name ?? item.menuItemId,
          nameEn: item.menuItem?.nameEn,
          nameFr: item.menuItem?.nameFr,
          nameAr: item.menuItem?.nameAr,
          notes: item.notes ?? null,
          modifiers: item.modifiers?.map((modifier) => ({
            groupName: modifier.groupName,
            groupNameEn: modifier.groupNameEn,
            groupNameFr: modifier.groupNameFr,
            groupNameAr: modifier.groupNameAr,
            optionName: modifier.optionName,
            optionNameEn: modifier.optionNameEn,
            optionNameFr: modifier.optionNameFr,
            optionNameAr: modifier.optionNameAr,
          })),
        })),
      };

      if (response.table) {
        await this.waiterNotificationsService.create({
          restaurantId: response.restaurantId,
          tableId: response.tableId,
          tableNumber: response.table.number,
          orderId: response.id,
          type: 'ORDER_READY_FOR_DELIVERY',
          message: `Order #${response.displayOrderId ?? response.dailyOrderNumber} is ready for table ${response.table.number}`,
          metadata: notificationMetadata,
        });
      } else {
        await this.waiterNotificationsService.create({
          restaurantId: response.restaurantId,
          orderId: response.id,
          type: 'ORDER_READY_FOR_PICKUP',
          message: `External order #${response.displayOrderId ?? response.dailyOrderNumber} is ready for pickup at cashier`,
          metadata: notificationMetadata,
        });
      }
    }

    return response;
  }

  async updateStaffOrderStatus(
    orderId: string,
    restaurantId: string,
    status: SharedOrderStatus,
    role: UserRole,
    actor?: AuthenticatedUser,
    reason?: string,
  ): Promise<OrderResponse> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const chefAllowed: SharedOrderStatus[] = [
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.DELIVERED,
    ];
    const cashierAllowed: SharedOrderStatus[] = [
      OrderStatus.DELIVERED,
      OrderStatus.PAID,
      OrderStatus.CANCELLED,
    ];
    const waiterAllowed: SharedOrderStatus[] = [OrderStatus.DELIVERED];
    const waiterCanCancelPendingOrder =
      role === UserRole.WAITER &&
      status === OrderStatus.CANCELLED &&
      order.status === OrderStatus.PENDING;

    if (role === UserRole.CHEF && !chefAllowed.includes(status)) {
      throw new ConflictException('CHEF can only move orders to PREPARING, READY, or DELIVERED');
    }

    if (role === UserRole.CASHIER && !cashierAllowed.includes(status)) {
      throw new ConflictException('CASHIER cannot apply this order status');
    }

    if (role === UserRole.WAITER && !waiterAllowed.includes(status) && !waiterCanCancelPendingOrder) {
      throw new ConflictException('WAITER can only move orders to DELIVERED or cancel pending orders');
    }

    const updated = await this.updateOrderStatus(orderId, status, reason, actor);
    await this.logStatusAudit(order, updated, actor, reason);
    return updated;
  }

  private async logStatusAudit(
      previousOrder: OrderWithItems,
      updatedOrder: OrderResponse,
      actor?: AuthenticatedUser,
      reason?: string,
    ) {
    await this.auditTrailService.record({
      actor: {
        restaurantId: previousOrder.restaurantId,
        userId: actor?.sub ?? null,
        userName: actor?.name ?? 'System',
        role: actor?.role ?? 'SYSTEM',
        staffCode: actor?.staffCode ?? null,
        sessionId: actor?.sessionId ?? null,
      },
      module: AuditLogModule.ORDERS,
      action: `ORDER_STATUS_${previousOrder.status}_TO_${updatedOrder.status}`,
      actionType: 'UPDATE_ORDER_STATUS',
      entityType: 'ORDER',
      entityId: updatedOrder.id,
      before: {
        status: previousOrder.status,
        total: Number(previousOrder.total),
        itemCount: previousOrder.items.reduce((sum, item) => sum + item.quantity, 0),
      },
      after: {
        status: updatedOrder.status,
        total: updatedOrder.total,
        itemCount: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
      },
      details: {
        orderId: updatedOrder.id,
        displayOrderId: updatedOrder.displayOrderId ?? null,
        dailyOrderNumber: updatedOrder.dailyOrderNumber,
        tableId: previousOrder.tableId,
        tableNumber: previousOrder.table?.number ?? null,
        orderType: previousOrder.orderType,
        previousStatus: previousOrder.status,
        nextStatus: updatedOrder.status,
        previousTotal: previousOrder.total,
        nextTotal: updatedOrder.total,
        previousItemCount: previousOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        nextItemCount: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        financialStatus: updatedOrder.financialStatus,
        paidAmount: updatedOrder.paidAmount,
        remainingAmount: updatedOrder.remainingAmount,
      },
      reason,
      riskFlags: [
        ...(actor?.role === UserRole.CASHIER ? ['cashier_status_change'] : []),
        ...(actor?.role === UserRole.WAITER ? ['waiter_status_change'] : []),
        ...(updatedOrder.status === OrderStatus.CANCELLED ? ['order_cancelled'] : []),
      ],
      context: {
        ipAddress: actor?.ipAddress,
        userAgent: actor?.userAgent,
      },
    });
  }

  private async logOrderAudit(
      previousOrder: OrderWithItems,
      updatedOrder: OrderResponse,
      actor: AuthenticatedUser | undefined,
      action: string,
      reason?: string,
      sourceContext?: string,
    ) {
    await this.auditTrailService.record({
      actor: {
        restaurantId: previousOrder.restaurantId,
        userId: actor?.sub ?? null,
        userName: actor?.name ?? 'System',
        role: actor?.role ?? 'SYSTEM',
        staffCode: actor?.staffCode ?? null,
        sessionId: actor?.sessionId ?? null,
      },
      module: AuditLogModule.ORDERS,
      action,
      actionType: 'UPDATE_ORDER_ITEMS',
      entityType: 'ORDER',
      entityId: updatedOrder.id,
      before: {
        status: previousOrder.status,
        total: previousOrder.total,
        version: previousOrder.version,
        items: previousOrder.items.map((item) => ({
          menuItemId: item.menuItemId,
          menuItemName: item.menuItem?.name ?? item.menuItemId,
          menuItemNameEn: item.menuItem?.nameEn ?? null,
          menuItemNameFr: item.menuItem?.nameFr ?? null,
          menuItemNameAr: item.menuItem?.nameAr ?? null,
          quantity: item.quantity,
          lineTotal: Number(item.price) * item.quantity,
          notes: item.notes,
          modifiers: item.modifiers.map((modifier) => ({
            groupName: modifier.groupName,
            groupNameEn: modifier.groupNameEn ?? null,
            groupNameFr: modifier.groupNameFr ?? null,
            groupNameAr: modifier.groupNameAr ?? null,
            optionName: modifier.optionName,
            optionNameEn: modifier.optionNameEn ?? null,
            optionNameFr: modifier.optionNameFr ?? null,
            optionNameAr: modifier.optionNameAr ?? null,
          })),
        })),
      },
      after: {
        status: updatedOrder.status,
        total: updatedOrder.total,
        version: updatedOrder.version,
        items: updatedOrder.items.map((item) => ({
          menuItemId: item.menuItemId,
          menuItemName: item.menuItem?.name ?? item.menuItemId,
          menuItemNameEn: item.menuItem?.nameEn ?? null,
          menuItemNameFr: item.menuItem?.nameFr ?? null,
          menuItemNameAr: item.menuItem?.nameAr ?? null,
          quantity: item.quantity,
          lineTotal: Number(item.price) * item.quantity,
          notes: item.notes,
          modifiers: (item.modifiers ?? []).map((modifier) => ({
            groupName: modifier.groupName,
            groupNameEn: modifier.groupNameEn ?? null,
            groupNameFr: modifier.groupNameFr ?? null,
            groupNameAr: modifier.groupNameAr ?? null,
            optionName: modifier.optionName,
            optionNameEn: modifier.optionNameEn ?? null,
            optionNameFr: modifier.optionNameFr ?? null,
            optionNameAr: modifier.optionNameAr ?? null,
          })),
        })),
      },
      details: {
        orderId: updatedOrder.id,
        dailyOrderNumber: updatedOrder.dailyOrderNumber,
        createdAt: previousOrder.createdAt.toISOString(),
        tableId: previousOrder.tableId,
        tableNumber: previousOrder.table?.number ?? null,
        orderType: previousOrder.orderType,
        previousStatus: previousOrder.status,
        nextStatus: updatedOrder.status,
        previousVersion: previousOrder.version,
        nextVersion: updatedOrder.version,
        previousTotal: Number(previousOrder.total),
        nextTotal: updatedOrder.total,
        totalDelta: updatedOrder.total - Number(previousOrder.total),
        previousItemCount: previousOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        nextItemCount: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        editedAt: new Date().toISOString(),
        sourceContext: sourceContext ?? null,
        previousItems: previousOrder.items.map((item) => ({
          menuItemId: item.menuItemId,
          menuItemName: item.menuItem?.name ?? item.menuItemId,
          menuItemNameEn: item.menuItem?.nameEn ?? null,
          menuItemNameFr: item.menuItem?.nameFr ?? null,
          menuItemNameAr: item.menuItem?.nameAr ?? null,
          quantity: item.quantity,
          lineTotal: Number(item.price) * item.quantity,
          notes: item.notes,
          modifiers: item.modifiers.map((modifier) => ({
            groupName: modifier.groupName,
            groupNameEn: modifier.groupNameEn ?? null,
            groupNameFr: modifier.groupNameFr ?? null,
            groupNameAr: modifier.groupNameAr ?? null,
            optionName: modifier.optionName,
            optionNameEn: modifier.optionNameEn ?? null,
            optionNameFr: modifier.optionNameFr ?? null,
            optionNameAr: modifier.optionNameAr ?? null,
          })),
        })),
        nextItems: updatedOrder.items.map((item) => ({
          menuItemId: item.menuItemId,
          menuItemName: item.menuItem?.name ?? item.menuItemId,
          menuItemNameEn: item.menuItem?.nameEn ?? null,
          menuItemNameFr: item.menuItem?.nameFr ?? null,
          menuItemNameAr: item.menuItem?.nameAr ?? null,
          quantity: item.quantity,
          lineTotal: Number(item.price) * item.quantity,
          notes: item.notes,
          modifiers: (item.modifiers ?? []).map((modifier) => ({
            groupName: modifier.groupName,
            groupNameEn: modifier.groupNameEn ?? null,
            groupNameFr: modifier.groupNameFr ?? null,
            groupNameAr: modifier.groupNameAr ?? null,
            optionName: modifier.optionName,
            optionNameEn: modifier.optionNameEn ?? null,
            optionNameFr: modifier.optionNameFr ?? null,
            optionNameAr: modifier.optionNameAr ?? null,
          })),
        })),
      },
      reason,
      riskFlags: [
        ...(previousOrder.status !== OrderStatus.PENDING ? ['modified_after_preparation_started'] : []),
        ...(actor?.role === UserRole.CASHIER ? ['cashier_item_edit'] : []),
        ...(actor?.role === UserRole.WAITER ? ['waiter_item_edit'] : []),
        ...(updatedOrder.total < Number(previousOrder.total) ? ['total_reduced'] : []),
        ...(updatedOrder.items.length < previousOrder.items.length ? ['items_removed'] : []),
      ],
      context: {
        ipAddress: actor?.ipAddress,
        userAgent: actor?.userAgent,
      },
    });
  }

  calculateTotal(items: CartItemDTO[], menuItems: MenuItemDTO[]) {
    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

    return items.reduce((sum, item) => {
      const menuItem = menuItemsById.get(item.menuItemId);
      if (!menuItem) {
        throw new BadRequestException('Invalid menu item');
      }

      const modifierTotal = this.calculateModifierTotal(item, menuItem);
      return sum + (Number(menuItem.price) + modifierTotal) * item.quantity;
    }, 0);
  }

  private calculateModifierTotal(item: CartItemDTO, menuItem: MenuItemDTO) {
    const selectedIds = new Set(item.modifierOptionIds ?? []);

    return (menuItem.modifierGroups ?? []).reduce((sum, group) => {
      const optionTotal = group.options
        .filter((option) => selectedIds.has(option.id))
        .reduce((groupSum, option) => groupSum + Number(option.priceDelta), 0);
      return sum + optionTotal;
    }, 0);
  }

  private async resolveSelections(items: CartItemDTO[], restaurantId: string) {
    const menuItems = await this.menuService.validateMenuItems(
      items.map((item) => item.menuItemId),
      restaurantId,
    );
    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

    return items.map((cartItem) => {
      const menuItem = menuItemsById.get(cartItem.menuItemId);
      if (!menuItem) {
        throw new BadRequestException('Invalid menu item');
      }

      const modifiers = this.resolveModifiersForItem(cartItem, menuItem);
      const unitPrice =
        Number(menuItem.price) + modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0);

      return {
        cartItem,
        menuItem,
        unitPrice,
        totalPrice: unitPrice * cartItem.quantity,
        modifiers,
      } satisfies ResolvedItemSelection;
    });
  }

  private resolveModifiersForItem(cartItem: CartItemDTO, menuItem: MenuItemDTO) {
    const groups = menuItem.modifierGroups ?? [];
    const selectedIds = [...new Set(cartItem.modifierOptionIds ?? [])];
    const selectedByGroup = new Map<string, ModifierOptionDTO[]>();
    const optionsById = new Map<string, { group: ModifierGroupDTO; option: ModifierOptionDTO }>();

    for (const group of groups) {
      for (const option of group.options) {
        optionsById.set(option.id, { group, option });
      }
    }

    for (const optionId of selectedIds) {
      const resolved = optionsById.get(optionId);
      if (!resolved) {
        throw new BadRequestException('Invalid modifier selection');
      }

      const current = selectedByGroup.get(resolved.group.id) ?? [];
      current.push(resolved.option);
      selectedByGroup.set(resolved.group.id, current);
    }

    for (const group of groups) {
      const selected = selectedByGroup.get(group.id) ?? [];

      if (group.required && selected.length < Math.max(group.minSelections, 1)) {
        throw new BadRequestException(`Missing required modifiers for ${group.name}`);
      }

      if (selected.length < group.minSelections) {
        throw new BadRequestException(`Not enough modifiers selected for ${group.name}`);
      }

      if (selected.length > group.maxSelections) {
        throw new BadRequestException(`Too many modifiers selected for ${group.name}`);
      }
    }

    return groups.flatMap((group) =>
      (selectedByGroup.get(group.id) ?? []).map((option) => ({
        modifierOptionId: option.id,
        groupName: group.name,
        groupNameEn: group.nameEn,
        groupNameFr: group.nameFr,
        groupNameAr: group.nameAr,
        optionName: option.name,
        optionNameEn: option.nameEn,
        optionNameFr: option.nameFr,
        optionNameAr: option.nameAr,
        priceDelta: Number(option.priceDelta),
      })),
    );
  }

  private get orderInclude() {
    return {
      table: {
        select: {
          id: true,
          number: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          notes: true,
          menuItemId: true,
          orderId: true,
          modifiers: {
            select: {
              id: true,
              modifierOptionId: true,
              groupName: true,
              groupNameEn: true,
              groupNameFr: true,
              groupNameAr: true,
              optionName: true,
              optionNameEn: true,
              optionNameFr: true,
              optionNameAr: true,
              priceDelta: true,
            },
          },
          menuItem: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              nameFr: true,
              nameAr: true,
              description: true,
              descriptionEn: true,
              descriptionFr: true,
              descriptionAr: true,
              price: true,
              image: true,
              available: true,
              featured: true,
              badge: true,
              badgeEn: true,
              badgeFr: true,
              badgeAr: true,
              sortOrder: true,
              menuId: true,
              restaurantId: true,
            },
          },
        },
      },
    } satisfies Prisma.OrderInclude;
  }

  private async createOrderWithDailyNumber(input: {
    restaurantId: string;
    tableId: string | null;
    parentOrderId?: string | null;
    guestSessionId?: string;
    source: OrderSource;
    orderType: PrismaOrderType;
    total: number;
    selections: ResolvedItemSelection[];
  }): Promise<OrderWithItems> {
    const businessDateKey = this.getBusinessDateKey(new Date());
    const businessDate = new Date(`${businessDateKey}T00:00:00.000Z`);

    for (let attempt = 0; attempt < ORDER_NUMBER_RETRY_LIMIT; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const latestOrder = await tx.order.findFirst({
              where: {
                restaurantId: input.restaurantId,
                businessDate,
              },
              orderBy: {
                dailyOrderNumber: 'desc',
              },
              select: {
                dailyOrderNumber: true,
              },
            });

            return tx.order.create({
              data: {
                restaurantId: input.restaurantId,
                tableId: input.tableId,
                parentOrderId: input.parentOrderId ?? null,
                guestSessionId: input.guestSessionId,
                source: input.source,
                status: OrderStatus.PENDING,
                orderType: input.orderType,
                total: input.total,
                businessDate,
                dailyOrderNumber: (latestOrder?.dailyOrderNumber ?? 0) + 1,
                items: {
                  create: input.selections.map((selection) => ({
                    menuItemId: selection.menuItem.id,
                    quantity: selection.cartItem.quantity,
                    price: selection.unitPrice,
                    notes: selection.cartItem.notes,
                    modifiers: selection.modifiers.length
                      ? {
                          create: selection.modifiers.map((modifier) => ({
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
                        }
                      : undefined,
                  })),
                },
              } as any,
              include: this.orderInclude,
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (
          attempt < ORDER_NUMBER_RETRY_LIMIT - 1 &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2002' || error.code === 'P2034')
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException('Unable to assign a daily order number');
  }

  private canTransition(current: OrderStatus, next: SharedOrderStatus) {
    return STATUS_TRANSITIONS[current].includes(next as OrderStatus);
  }

  private assertCustomerAccessContext(
    restaurantId?: string,
    tableId?: string,
    guestSessionId?: string,
  ) {
    if (!restaurantId || !tableId || !guestSessionId) {
      throw new ForbiddenException(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
    }
  }

  private assertCustomerReadContext(restaurantId?: string, tableId?: string) {
    if (!restaurantId || !tableId) {
      throw new ForbiddenException(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
    }
  }

  private async assertCustomerTableAccess(restaurantId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId,
      },
      select: { id: true },
    });

    if (!table) {
      throw new ForbiddenException(CUSTOMER_ORDER_ACCESS_FORBIDDEN_MESSAGE);
    }
  }

  private resolveOrderType(
    requestedOrderType: OrderType | undefined,
    tableId?: string,
  ): PrismaOrderType {
    if (requestedOrderType) {
      return requestedOrderType as PrismaOrderType;
    }

    if (!tableId) {
      throw new BadRequestException('orderType is required when tableId is not provided');
    }

    return PrismaOrderType.DINE_IN;
  }

  private getBusinessDateKey(date: Date) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: BUSINESS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private groupOrdersByTable(orders: OrderResponse[]): TableOrdersGroupDTO[] {
    const groups = new Map<string, TableOrdersGroupDTO>();

    for (const order of orders) {
      const key = order.tableId || `walk-in:${order.id}`;
      const current = groups.get(key);

      if (!current) {
        groups.set(key, {
          summary: {
            tableId: order.tableId,
            tableNumber: order.table?.number ?? null,
            totalOrders: 1,
            totalAmount: order.grandTotal,
            preparingOrders: order.status === 'PREPARING' ? 1 : 0,
            readyOrders: order.status === 'READY' ? 1 : 0,
            deliveredOrders: order.status === 'DELIVERED' ? 1 : 0,
          },
          orders: [order],
        });
        continue;
      }

      current.orders.push(order);
      current.summary.totalOrders += 1;
      current.summary.totalAmount += order.grandTotal;
      current.summary.preparingOrders += order.status === 'PREPARING' ? 1 : 0;
      current.summary.readyOrders += order.status === 'READY' ? 1 : 0;
      current.summary.deliveredOrders += order.status === 'DELIVERED' ? 1 : 0;
    }

    return Array.from(groups.values()).map((group) => ({
      ...group,
      orders: group.orders.sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      ),
    }));
  }

  private async resolveParentOrderIdForStaffOrder(restaurantId: string, tableId?: string) {
    if (!tableId) {
      return null;
    }

    const latestTableOrder = await this.prisma.order.findFirst({
      where: {
        restaurantId,
        tableId,
        source: OrderSource.STAFF,
        status: { in: [...STAFF_EDITABLE_STATUSES, ...STAFF_LOCKED_STATUSES] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        parentOrderId: true,
        status: true,
      } as any,
    });

    if (!latestTableOrder) {
      return null;
    }

    if (STAFF_EDITABLE_STATUSES.includes((latestTableOrder as any).status as OrderStatus)) {
      return null;
    }

    return (latestTableOrder as any).parentOrderId ?? latestTableOrder.id;
  }

  private async respondWithBulkFinancials(
    orders: OrderWithItems[],
    restaurantId: string,
  ): Promise<OrderResponse[]> {
    if (orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);
    let taxRate = 0;

    try {
      const settings = await this.prisma.restaurantSettings.findUnique({
        where: { restaurantId },
        select: { salesTax: true },
      });
      taxRate = Number(settings?.salesTax ?? 0);
    } catch (error) {
      if (!this.isLegacyFinancialSchemaIssue(error)) throw error;
      this.logger.warn('Falling back to zero tax rate for bulk financial summaries');
    }

    const [allDiscounts, allPayments] = await Promise.all([
      this.prisma.discount.findMany({
        where: { orderId: { in: orderIds }, order: { restaurantId } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.payment.findMany({
        where: { orderId: { in: orderIds }, order: { restaurantId } },
      }),
    ]);

    const discountsByOrder = new Map<string, typeof allDiscounts>();
    for (const d of allDiscounts) {
      if (!discountsByOrder.has(d.orderId)) discountsByOrder.set(d.orderId, []);
      discountsByOrder.get(d.orderId)!.push(d);
    }

    const paymentsByOrder = new Map<string, typeof allPayments>();
    for (const p of allPayments) {
      if (!paymentsByOrder.has(p.orderId)) paymentsByOrder.set(p.orderId, []);
      paymentsByOrder.get(p.orderId)!.push(p);
    }

    return Promise.all(
      orders.map((order) => {
        const orderDiscounts = discountsByOrder.get(order.id) ?? [];
        const orderPayments = paymentsByOrder.get(order.id) ?? [];
        const summary = this.computeFinancialSummary(
          order,
          orderDiscounts,
          orderPayments,
          taxRate,
        );
        return this.toOrderResponse(order, summary);
      }),
    );
  }

  private computeFinancialSummary(
    order: OrderWithItems,
    discounts: Array<{ value: Prisma.Decimal | number; type: DiscountType; approvalStatus: DiscountApprovalStatus }>,
    payments: Array<{ amount: Prisma.Decimal | number; refundedAmount: Prisma.Decimal | number; status: PaymentStatus }>,
    taxRate: number,
  ): OrderFinancialSummaryDTO {
    const subtotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    let runningSubtotal = subtotal;
    let discountTotal = 0;

    for (const discount of discounts) {
      if (discount.approvalStatus !== DiscountApprovalStatus.APPROVED) continue;
      const discountValue = Number(discount.value);
      const appliedAmount =
        discount.type === DiscountType.PERCENTAGE
          ? (runningSubtotal * discountValue) / 100
          : discountValue;
      const boundedAmount = Math.min(Math.max(appliedAmount, 0), runningSubtotal);
      discountTotal += boundedAmount;
      runningSubtotal = Math.max(runningSubtotal - boundedAmount, 0);
    }

    const discountedSubtotal = runningSubtotal;
    const taxTotal = discountedSubtotal * (taxRate / 100);
    const grandTotal = discountedSubtotal + taxTotal;

    const paidAmount = payments
      .filter((payment) => payment.status !== PaymentStatus.CANCELLED)
      .reduce((sum, payment) => sum + Math.max(Number(payment.amount) - Number(payment.refundedAmount), 0), 0);

    const refundedAmount = payments.reduce((sum, payment) => sum + Number(payment.refundedAmount), 0);

    const remainingAmount = Math.max(grandTotal - paidAmount, 0);

    let financialStatus: OrderFinancialSummaryDTO['financialStatus'] = 'UNPAID';
    if (order.status === OrderStatus.CANCELLED) {
      financialStatus = 'CANCELLED';
    } else if (grandTotal === 0 && discountTotal > 0) {
      financialStatus = 'PAID';
    } else if (paidAmount >= grandTotal && grandTotal > 0) {
      financialStatus = refundedAmount >= paidAmount && paidAmount > 0 ? 'REFUNDED' : 'PAID';
    } else if (paidAmount > 0) {
      financialStatus = 'PARTIALLY_PAID';
    } else if (refundedAmount > 0 && paidAmount <= 0) {
      financialStatus = 'REFUNDED';
    }

    return {
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      paidAmount,
      remainingAmount,
      financialStatus,
    };
  }

  private async toOrderResponse(
    order: OrderWithItems,
    precomputedFinancialSummary?: OrderFinancialSummaryDTO,
  ): Promise<OrderResponse> {
    const isWalkInOrder = order.orderType === PrismaOrderType.TAKEAWAY;
    const financialSummary = precomputedFinancialSummary ?? (await this.buildFinancialSummary(order));
    const displayOrderId = await this.buildDisplayOrderId(order);

    return {
      id: order.id,
      displayOrderId,
      status: order.status,
      orderType: order.orderType as OrderType,
      source: order.source as SharedOrderSource,
      parentOrderId: (order as any).parentOrderId ?? null,
      total: financialSummary.grandTotal,
      subtotal: financialSummary.subtotal,
      discountTotal: financialSummary.discountTotal,
      taxTotal: financialSummary.taxTotal,
      grandTotal: financialSummary.grandTotal,
      paidAmount: financialSummary.paidAmount,
      remainingAmount: financialSummary.remainingAmount,
      financialStatus: financialSummary.financialStatus,
      financialSummary,
      businessDate: order.businessDate.toISOString(),
      dailyOrderNumber: order.dailyOrderNumber,
      tableId: order.tableId ?? '',
      restaurantId: order.restaurantId,
      guestSessionId: order.guestSessionId,
      version: order.version,
      lockedAt: order.lockedAt?.toISOString() ?? null,
      serviceTimes: {
        createdAt: order.createdAt.toISOString(),
        acceptedAt: order.lockedAt?.toISOString() ?? null,
        preparationStartedAt: (order as any).preparationStartedAt?.toISOString() ?? null,
        readyAt: (order as any).readyAt?.toISOString() ?? null,
        deliveredAt: (order as any).deliveredAt?.toISOString() ?? null,
      },
      table: isWalkInOrder
        ? undefined
        : {
            id: order.table!.id,
            number: order.table!.number,
          },
      createdAt: order.createdAt.toISOString(),
      lastModifiedAt: order.lastModifiedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        notes: item.notes,
        orderId: item.orderId,
        menuItemId: item.menuItemId,
        modifiers: item.modifiers.map((modifier) => ({
          id: modifier.id,
          modifierOptionId: modifier.modifierOptionId,
          groupName: modifier.groupName,
          groupNameEn: modifier.groupNameEn,
          groupNameFr: modifier.groupNameFr,
          groupNameAr: modifier.groupNameAr,
          optionName: modifier.optionName,
          optionNameEn: modifier.optionNameEn,
          optionNameFr: modifier.optionNameFr,
          optionNameAr: modifier.optionNameAr,
          priceDelta: Number(modifier.priceDelta),
        })),
        menuItem: {
          id: item.menuItem.id,
          name: item.menuItem.name,
          nameEn: item.menuItem.nameEn,
          nameFr: item.menuItem.nameFr,
          nameAr: item.menuItem.nameAr,
          description: item.menuItem.description,
          descriptionEn: item.menuItem.descriptionEn,
          descriptionFr: item.menuItem.descriptionFr,
          descriptionAr: item.menuItem.descriptionAr,
          price: Number(item.menuItem.price),
          image: item.menuItem.image,
          available: item.menuItem.available,
          featured: item.menuItem.featured,
          badge: item.menuItem.badge,
          badgeEn: item.menuItem.badgeEn,
          badgeFr: item.menuItem.badgeFr,
          badgeAr: item.menuItem.badgeAr,
          sortOrder: item.menuItem.sortOrder,
          menuId: item.menuItem.menuId,
          restaurantId: item.menuItem.restaurantId,
        },
      })),
    };
  }

  private async buildDisplayOrderId(order: OrderWithItems) {
    const groupRootId = (order as any).parentOrderId ?? order.id;
    const [rootOrders, groupOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          restaurantId: order.restaurantId,
          businessDate: order.businessDate,
          ...( { parentOrderId: null } as any ),
        },
        orderBy: [
          { createdAt: 'asc' },
          { dailyOrderNumber: 'asc' },
        ],
        select: {
          id: true,
        },
        take: 100,
      }),
      this.prisma.order.findMany({
        where: {
          restaurantId: order.restaurantId,
          businessDate: order.businessDate,
          OR: [{ id: groupRootId }, ({ parentOrderId: groupRootId } as any)],
        },
        orderBy: [
          { createdAt: 'asc' },
          { dailyOrderNumber: 'asc' },
        ],
        select: {
          id: true,
        },
      }),
    ]);

    const groupSequence = rootOrders.findIndex((entry) => entry.id === groupRootId) + 1;
    const subIndex = groupOrders.findIndex((entry) => entry.id === order.id) + 1;
    const channelCode =
      order.orderType === PrismaOrderType.DINE_IN ? 'A' : 'B';

    return `${Math.max(groupSequence, 1)}${channelCode}${Math.max(subIndex, 1)}`;
  }

  private async buildFinancialSummary(order: OrderWithItems): Promise<OrderFinancialSummaryDTO> {
    const subtotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    try {
      const settings = await this.prisma.restaurantSettings.findUnique({
        where: { restaurantId: order.restaurantId },
        select: { salesTax: true },
      });
      const { discountTotal, discountedSubtotal } = await this.discountsService.summarizeByOrder(
        order.id,
        order.restaurantId,
        subtotal,
      );
      const taxRate = Number(settings?.salesTax ?? 0);
      const taxTotal = discountedSubtotal * (taxRate / 100);
      const grandTotal = discountedSubtotal + taxTotal;
      const { paidAmount, refundedAmount } = await this.paymentsService.summarizeByOrder(
        order.id,
        order.restaurantId,
      );

      const remainingAmount = Math.max(grandTotal - paidAmount, 0);

      let financialStatus: OrderFinancialSummaryDTO['financialStatus'] = 'UNPAID';
      if (order.status === OrderStatus.CANCELLED) {
        financialStatus = 'CANCELLED';
      } else if (grandTotal === 0 && discountTotal > 0) {
        financialStatus = 'PAID';
      } else if (paidAmount >= grandTotal && grandTotal > 0) {
        financialStatus = refundedAmount >= paidAmount && paidAmount > 0 ? 'REFUNDED' : 'PAID';
      } else if (paidAmount > 0) {
        financialStatus = 'PARTIALLY_PAID';
      } else if (refundedAmount > 0 && paidAmount <= 0) {
        financialStatus = 'REFUNDED';
      }

      return {
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal,
        paidAmount,
        remainingAmount,
        financialStatus,
      };
    } catch (error) {
      if (!this.isLegacyFinancialSchemaIssue(error)) {
        throw error;
      }

      this.logger.warn(
        `Falling back to legacy financial summary for order ${order.id}: ${error instanceof Error ? error.message : 'Unknown schema error'}`,
      );
    }

    const grandTotal = subtotal;
    const remainingAmount = grandTotal;

    let financialStatus: OrderFinancialSummaryDTO['financialStatus'] = 'UNPAID';
    if (order.status === OrderStatus.CANCELLED) {
      financialStatus = 'CANCELLED';
    }

    return {
      subtotal,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal,
      paidAmount: 0,
      remainingAmount,
      financialStatus,
    };
  }

  private isLegacyFinancialSchemaIssue(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2022')
    );
  }

  private async depleteInventoryForOrder(order: OrderWithItems) {
    const alreadyDepleted = await this.prisma.inventoryConsumptionLog.findFirst({
      where: { orderId: order.id },
      select: { id: true },
    });
    if (alreadyDepleted) {
      this.logger.warn(`Stock already deducted for order ${order.id}, skipping depleteInventoryForOrder`);
      return;
    }

    const menuItemIds = [...new Set(order.items.map((item) => item.menuItemId))];

    const ingredients = await this.prisma.menuItemIngredient.findMany({
      where: { menuItemId: { in: menuItemIds } },
    });

    if (ingredients.length === 0) {
      return;
    }

    const consumptionData: Array<{
      inventoryItemId: string;
      totalQuantity: number;
    }> = [];

    for (const ingredient of ingredients) {
      const totalOrderQty = order.items
        .filter((item) => item.menuItemId === ingredient.menuItemId)
        .reduce((sum, item) => sum + item.quantity, 0);

      const totalConsumed = ingredient.quantityRequired * totalOrderQty;

      if (totalConsumed <= 0) {
        continue;
      }

      consumptionData.push({
        inventoryItemId: ingredient.inventoryItemId,
        totalQuantity: totalConsumed,
      });
    }

    if (consumptionData.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        consumptionData.map(async (consumption) => {
          const updated = await tx.inventoryItem.update({
            where: { id: consumption.inventoryItemId },
            data: { stockLevel: { decrement: consumption.totalQuantity } },
          });

          const newStatus =
            updated.stockLevel <= updated.minAlertLevel * 0.5
              ? ('CRITICAL' as const)
              : updated.stockLevel <= updated.minAlertLevel
                ? ('LOW_STOCK' as const)
                : ('HEALTHY' as const);

          await tx.inventoryItem.update({
            where: { id: consumption.inventoryItemId },
            data: { status: newStatus },
          });
        }),
      );

      await tx.inventoryConsumptionLog.createMany({
        data: consumptionData.map((consumption) => ({
          restaurantId: order.restaurantId,
          inventoryItemId: consumption.inventoryItemId,
          orderId: order.id,
          quantityUsed: consumption.totalQuantity,
          type: ConsumptionType.AUTO_DEDUCTION,
        })),
      });
    });
  }

  private async depleteModifierIngredientsForOrder(order: OrderWithItems) {
    const alreadyDepleted = await this.prisma.inventoryConsumptionLog.findFirst({
      where: { orderId: order.id },
      select: { id: true },
    });
    if (alreadyDepleted) {
      this.logger.warn(`Stock already deducted for order ${order.id}, skipping depleteModifierIngredientsForOrder`);
      return;
    }

    const modifierOptionIds: string[] = [];

    for (const item of order.items) {
      for (const modifier of item.modifiers) {
        if (modifier.modifierOptionId) {
          modifierOptionIds.push(modifier.modifierOptionId);
        }
      }
    }

    if (modifierOptionIds.length === 0) {
      return;
    }

    const ingredients = await this.prisma.modifierIngredient.findMany({
      where: { modifierOptionId: { in: modifierOptionIds } },
    });

    if (ingredients.length === 0) {
      return;
    }

    const consumptionData: Array<{
      inventoryItemId: string;
      totalQuantity: number;
    }> = [];

    for (const ingredient of ingredients) {
      let totalOrderQty = 0;

      for (const item of order.items) {
        const matchCount = item.modifiers.filter(
          (m) => m.modifierOptionId === ingredient.modifierOptionId,
        ).length;

        if (matchCount > 0) {
          totalOrderQty += item.quantity * matchCount;
        }
      }

      const totalConsumed = ingredient.quantityRequired * totalOrderQty;

      if (totalConsumed <= 0) {
        continue;
      }

      consumptionData.push({
        inventoryItemId: ingredient.inventoryItemId,
        totalQuantity: totalConsumed,
      });
    }

    if (consumptionData.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        consumptionData.map(async (consumption) => {
          const updated = await tx.inventoryItem.update({
            where: { id: consumption.inventoryItemId },
            data: { stockLevel: { decrement: consumption.totalQuantity } },
          });

          const newStatus =
            updated.stockLevel <= updated.minAlertLevel * 0.5
              ? ('CRITICAL' as const)
              : updated.stockLevel <= updated.minAlertLevel
                ? ('LOW_STOCK' as const)
                : ('HEALTHY' as const);

          await tx.inventoryItem.update({
            where: { id: consumption.inventoryItemId },
            data: { status: newStatus },
          });
        }),
      );

      await tx.inventoryConsumptionLog.createMany({
        data: consumptionData.map((consumption) => ({
          restaurantId: order.restaurantId,
          inventoryItemId: consumption.inventoryItemId,
          orderId: order.id,
          quantityUsed: consumption.totalQuantity,
          type: ConsumptionType.AUTO_DEDUCTION,
        })),
      });
    });
  }
}
