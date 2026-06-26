import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IdParamDto } from '../../common/dto/uuid-param.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.list(user.restaurantId);
  }

  @Post()
  create(@Body() input: CreateInventoryItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.create({
      ...input,
      restaurantId: user.restaurantId,
    });
  }

  @Patch(':id')
  update(
    @Param() params: IdParamDto,
    @Body() input: UpdateInventoryItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.update(params.id, user.restaurantId, input);
  }
}
