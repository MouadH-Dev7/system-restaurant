import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type {
  FloorDTO,
  TableBillingDTO,
  TableDTO,
  TableTimelineCategory,
  TableTimelineEntryDTO,
  WaiterNotificationDTO,
} from '@repo/shared-types';
import { IdParamDto } from '../../common/dto/uuid-param.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateFloorDto } from './dto/create-floor.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { TableQueryDto } from './dto/table-query.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { UpdateWaiterNotificationDto } from './dto/update-waiter-notification.dto';
import { TablesService } from './tables.service';
import { TableOperationsService } from './table-operations.service';
import { WaiterCallService } from './waiter-call.service';
import { WaiterNotificationsService } from './waiter-notifications.service';

type RequestLike = {
  protocol?: string;
  headers?: Record<string, string | string[] | undefined>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

@Controller('tables')
export class TablesController {
  constructor(
    private readonly tablesService: TablesService,
    private readonly waiterCallService: WaiterCallService,
    private readonly waiterNotificationsService: WaiterNotificationsService,
    private readonly tableOperationsService: TableOperationsService,
  ) {}

  private requestUrl(request: RequestLike, customerAppOrigin?: string) {
    return {
      host: firstValue(request.headers?.host),
      forwardedHost: firstValue(request.headers?.['x-forwarded-host']),
      protocol: request.protocol,
      forwardedProto: firstValue(request.headers?.['x-forwarded-proto']),
      customerAppOrigin: customerAppOrigin ?? firstValue(request.headers?.['x-customer-app-origin']),
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() input: CreateTableDto,
    @Req() request: RequestLike,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TableDTO> {
    return this.tablesService.createTable(
      {
        ...input,
        restaurantId: user.restaurantId,
      },
      this.requestUrl(request),
    );
  }

  @Get('network-info')
  @Header('Cache-Control', 'no-store')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getNetworkInfo(@Query('clientHost') clientHost?: string) {
    return this.tablesService.getNetworkInfo(clientHost);
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  findAll(
    @Query() query: TableQueryDto,
    @Req() request: RequestLike,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TableDTO[]> {
    return this.tablesService.listTables(
      user.restaurantId,
      this.requestUrl(request, query.customerAppOrigin),
    );
  }

  @Get('floors/list')
  @Header('Cache-Control', 'no-store')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  listFloors(@CurrentUser() user: AuthenticatedUser): Promise<FloorDTO[]> {
    return this.tablesService.listFloors(user.restaurantId);
  }

  @Post('floors')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createFloor(
    @Body() input: CreateFloorDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FloorDTO> {
    return this.tablesService.createFloor({
      ...input,
      restaurantId: user.restaurantId,
    });
  }

  @Patch('floors/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateFloor(
    @Param() params: IdParamDto,
    @Body() input: UpdateFloorDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FloorDTO> {
    return this.tablesService.updateFloor(params.id, user.restaurantId, input);
  }

  @Delete('floors/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  deleteFloor(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser): Promise<FloorDTO> {
    return this.tablesService.deleteFloor(params.id, user.restaurantId);
  }

  @Get('waiter-notifications/list')
  @Header('Cache-Control', 'no-store')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  listWaiterNotifications(@CurrentUser() user: AuthenticatedUser): Promise<WaiterNotificationDTO[]> {
    return this.waiterNotificationsService.listActive(user);
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  findById(
    @Param() params: IdParamDto,
    @Req() request: RequestLike,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TableDTO> {
    return this.tablesService.findById(params.id, user.restaurantId, this.requestUrl(request));
  }

  @Get(':id/timeline')
  @Header('Cache-Control', 'no-store')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  getTableTimeline(
    @Param() params: IdParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category: TableTimelineCategory = 'ALL',
  ): Promise<TableTimelineEntryDTO[]> {
    return this.tableOperationsService.getTableTimeline(params.id, user.restaurantId, category);
  }

  @Get(':id/billing')
  @Header('Cache-Control', 'no-store')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  getTableBilling(
    @Param() params: IdParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TableBillingDTO> {
    return this.tableOperationsService.getTableBilling(params.id, user.restaurantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  update(
    @Param() params: IdParamDto,
    @Body() input: UpdateTableDto,
    @Req() request: RequestLike,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TableDTO> {
    return this.tablesService.updateTable(
      params.id,
      user.restaurantId,
      input,
      this.requestUrl(request),
    );
  }

  @Post(':id/call-waiter')
  @Public()
  callWaiter(
    @Param() params: IdParamDto,
    @Query('restaurantId') restaurantId?: string,
  ) {
    return this.waiterCallService.callWaiter(restaurantId, params.id);
  }

  @Patch('waiter-notifications/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  updateWaiterNotification(
    @Param() params: IdParamDto,
    @Body() input: UpdateWaiterNotificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WaiterNotificationDTO> {
    if (input.status === 'ACCEPTED') {
      return this.waiterNotificationsService.accept(params.id, user);
    }

    return this.waiterNotificationsService.resolve(params.id, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser): Promise<TableDTO> {
    return this.tablesService.deleteTable(params.id, user.restaurantId);
  }
}
