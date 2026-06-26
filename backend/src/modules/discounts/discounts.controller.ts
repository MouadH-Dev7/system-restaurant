import { Body, Controller, Get, Param, Patch, Post, Delete, Query } from '@nestjs/common';
import { DiscountApprovalStatus, DiscountType, UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/uuid-param.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ApproveDiscountDto } from './dto/approve-discount.dto';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { DiscountsService } from './discounts.service';

@Controller('discounts')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  create(@Body() input: CreateDiscountDto, @CurrentUser() user: AuthenticatedUser) {
    return this.discountsService.create({ ...input, actor: user });
  }

  @Get('order/:id')
  listByOrder(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.discountsService.listByOrder(params.id, user);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('approvalStatus') approvalStatus?: DiscountApprovalStatus,
    @Query('type') type?: DiscountType,
    @Query('createdBy') createdBy?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
  ) {
    return this.discountsService.listForRestaurant(user.restaurantId, {
      approvalStatus,
      type,
      createdBy,
      dateFrom,
      dateTo,
      search,
    });
  }

  @Patch(':id')
  update(
    @Param() params: IdParamDto,
    @Body() input: UpdateDiscountDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discountsService.update(params.id, { ...input, actor: user });
  }

  @Delete(':id')
  remove(
    @Param() params: IdParamDto,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discountsService.remove(params.id, reason, user);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  approve(
    @Param() params: IdParamDto,
    @Body() input: ApproveDiscountDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discountsService.approve(params.id, input.reason, user);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  reject(
    @Param() params: IdParamDto,
    @Body() input: ApproveDiscountDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discountsService.reject(params.id, input.reason, user);
  }
}
