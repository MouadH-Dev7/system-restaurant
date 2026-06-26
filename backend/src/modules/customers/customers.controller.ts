import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IdParamDto } from '../../common/dto/uuid-param.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@Controller('customers')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.list(user.restaurantId);
  }

  @Post()
  create(@Body() input: CreateCustomerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.customersService.create({
      ...input,
      restaurantId: user.restaurantId,
    });
  }

  @Patch(':id')
  update(
    @Param() params: IdParamDto,
    @Body() input: UpdateCustomerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customersService.update(params.id, user.restaurantId, input);
  }
}
