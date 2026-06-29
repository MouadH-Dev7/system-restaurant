import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { PaymentMethod, PaymentStatus, UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/uuid-param.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ChangePaymentMethodDto } from './dto/change-payment-method.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() input: CreatePaymentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.create({ ...input, actor: user });
  }

  @Patch(':id')
  update(
    @Param() params: IdParamDto,
    @Body() input: UpdatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.update(params.id, { ...input, actor: user });
  }

  @Patch(':id/cancel')
  cancel(
    @Param() params: IdParamDto,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.cancel(params.id, reason, user);
  }

  @Patch(':id/refund')
  refund(
    @Param() params: IdParamDto,
    @Body() input: RefundPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.refund(params.id, { ...input, actor: user });
  }

  @Patch(':id/method')
  changeMethod(
    @Param() params: IdParamDto,
    @Body() input: ChangePaymentMethodDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.changeMethod(params.id, { ...input, actor: user });
  }

  @Get('order/:id')
  history(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.listByOrder(params.id, user);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('status') status?: PaymentStatus,
    @Query('createdBy') createdBy?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
  ) {
    return this.paymentsService.listForRestaurant(user.restaurantId, {
      paymentMethod,
      status,
      createdBy,
      dateFrom,
      dateTo,
      search,
    });
  }
}
