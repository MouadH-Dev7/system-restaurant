import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IdParamDto } from '../../common/dto/uuid-param.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.suppliersService.list(user.restaurantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() input: CreateSupplierDto, @CurrentUser() user: AuthenticatedUser) {
    return this.suppliersService.create({
      ...input,
      restaurantId: user.restaurantId,
    });
  }

  @Patch(':id')
  update(
    @Param() params: IdParamDto,
    @Body() input: UpdateSupplierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliersService.update(params.id, user.restaurantId, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.suppliersService.remove(params.id, user.restaurantId);
  }
}
