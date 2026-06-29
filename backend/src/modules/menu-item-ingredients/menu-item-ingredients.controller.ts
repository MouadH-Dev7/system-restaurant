import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateMenuItemIngredientDto } from './dto/create-menu-item-ingredient.dto';
import { UpdateMenuItemIngredientDto } from './dto/update-menu-item-ingredient.dto';
import { MenuItemIngredientsService } from './menu-item-ingredients.service';

@Controller('menu-item-ingredients')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class MenuItemIngredientsController {
  constructor(private readonly service: MenuItemIngredientsService) {}

  @Get()
  findByMenuItem(@Query('menuItemId') menuItemId: string) {
    return this.service.findByMenuItem(menuItemId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() input: CreateMenuItemIngredientDto) {
    return this.service.create(input);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateMenuItemIngredientDto) {
    return this.service.update(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
