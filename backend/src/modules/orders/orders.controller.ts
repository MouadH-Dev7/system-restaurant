import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { OrderResponse, TableOrdersGroupDTO } from '@repo/shared-types';
import { IdParamDto } from '../../common/dto/uuid-param.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CustomerOrderQueryDto } from './dto/customer-order-query.dto';
import { CustomerOrdersQueryDto } from './dto/customer-orders-query.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateStaffOrderDto } from './dto/create-staff-order.dto';
import { UpdateOrderItemsDto } from './dto/update-order-items.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Public()
  createOrder(@Body() input: CreateOrderDto): Promise<OrderResponse> {
    return this.ordersService.createOrder(input);
  }

  @Get()
  @Public()
  listRestaurantOrders(@Query() query: CustomerOrdersQueryDto): Promise<OrderResponse[]> {
    return this.ordersService.listRestaurantOrders({
      ...query,
      scope: 'customer',
    }) as Promise<OrderResponse[]>;
  }

  @Post('staff')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  createStaffOrder(
    @Body() input: CreateStaffOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponse> {
    const { restaurantId: _ignored, ...rest } = input as CreateStaffOrderDto & {
      restaurantId?: string;
    };
    return this.ordersService.createStaffOrder(user, rest);
  }

  @Get('staff/list')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.CHEF, UserRole.WAITER)
  listStaffOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('scope') scope: 'kitchen' | 'pos' = 'kitchen',
    @Query('view') view: 'list' | 'table' = 'list',
    @Query('includeHistory') includeHistory?: 'today',
  ): Promise<OrderResponse[] | TableOrdersGroupDTO[]> {
    return this.ordersService.listStaffOrders(user, scope, view, includeHistory);
  }

  @Get('staff/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.CHEF, UserRole.WAITER)
  getStaffOrderById(
    @Param() params: IdParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponse> {
    return this.ordersService.getOrderById(params.id, user.restaurantId);
  }

  @Get(':id')
  @Public()
  getOrderById(
    @Param() params: IdParamDto,
    @Query() query: CustomerOrderQueryDto,
  ): Promise<OrderResponse> {
    return this.ordersService.getCustomerOrderById(
      params.id,
      query.restaurantId,
      query.tableId,
      query.guestSessionId,
    );
  }

  @Patch(':id/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  updateOrderItems(
    @Param() params: IdParamDto,
    @Body() input: UpdateOrderItemsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponse> {
    return this.ordersService.updateStaffOrderItems(params.id, user.restaurantId, input, user);
  }

  @Patch(':id/items/customer')
  @Public()
  updateCustomerOrderItems(
    @Param() params: IdParamDto,
    @Body() input: UpdateOrderItemsDto,
    @Query() query: CustomerOrderQueryDto,
  ): Promise<OrderResponse> {
    return this.ordersService.updateCustomerOrderItems(
      params.id,
      input,
      query.restaurantId,
      query.tableId,
      query.guestSessionId,
    );
  }

  @Patch(':id/cancel/customer')
  @Public()
  cancelCustomerOrder(
    @Param() params: IdParamDto,
    @Query() query: CustomerOrderQueryDto,
  ): Promise<OrderResponse> {
    return this.ordersService.cancelCustomerOrder(
      params.id,
      query.restaurantId,
      query.tableId,
      query.guestSessionId,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.CHEF, UserRole.WAITER)
  updateOrderStatus(
    @Param() params: IdParamDto,
    @Body() input: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponse> {
    return this.ordersService.updateStaffOrderStatus(
      params.id,
      user.restaurantId,
      input.status,
      user.role,
      user,
      input.reason,
    );
  }
}
