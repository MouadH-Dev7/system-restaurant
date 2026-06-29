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
import { CreateSupplierCategoryDto } from './dto/create-supplier-category.dto';
import { UpdateSupplierCategoryDto } from './dto/update-supplier-category.dto';
import { SupplierCategoryService } from './supplier-category.service';

@Controller('supplier-categories')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class SupplierCategoryController {
  constructor(private readonly service: SupplierCategoryService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user.restaurantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() input: CreateSupplierCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create({ ...input, restaurantId: user.restaurantId });
  }

  @Patch(':id')
  update(@Param() params: IdParamDto, @Body() input: UpdateSupplierCategoryDto) {
    return this.service.update(params.id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() params: IdParamDto) {
    return this.service.remove(params.id);
  }
}
