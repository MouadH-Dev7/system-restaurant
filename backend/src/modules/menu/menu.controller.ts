import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type {
  CreateModifierGroupInput,
  CreateModifierOptionInput,
  CreateMenuInput,
  CreateMenuItemInput,
  MenuDTO,
  MenuItemDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
  UpdateModifierGroupInput,
  UpdateModifierOptionInput,
  UpdateMenuInput,
  UpdateMenuItemInput,
} from '@repo/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { AuthenticatedMenuItemsQueryDto } from './dto/menu-items-auth-query.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateMenuDto } from './dto/create-menu.dto';
import { MenuItemsQueryDto } from './dto/menu-items-query.dto';
import { MenuQueryDto } from './dto/menu-query.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuService } from './menu.service';

@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Public()
  @Get('public/menus')
  getPublicMenus(@Query() query: MenuQueryDto): Promise<MenuDTO[]> {
    return this.menuService.getMenus(query.restaurantId);
  }

  @Public()
  @Get('public/menu-items')
  getPublicMenuItems(@Query() query: MenuItemsQueryDto): Promise<MenuItemDTO[]> {
    return this.menuService.getMenuItems(query.restaurantId, query.menuId ?? undefined, {
      availableOnly: query.availableOnly === 'true',
      activeMenusOnly: query.activeMenusOnly === 'true',
    });
  }

  @Get('menus')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.CHEF, UserRole.WAITER)
  getMenus(@CurrentUser() user: AuthenticatedUser): Promise<MenuDTO[]> {
    return this.menuService.getMenus(user.restaurantId);
  }

  @Get('menu-items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.CHEF, UserRole.WAITER)
  getMenuItems(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AuthenticatedMenuItemsQueryDto,
  ): Promise<MenuItemDTO[]> {
    return this.menuService.getMenuItems(user.restaurantId, query.menuId ?? undefined, {
      availableOnly: query.availableOnly === 'true',
      activeMenusOnly: query.activeMenusOnly === 'true',
    });
  }

  @Post('menus')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createMenu(@Body() input: CreateMenuDto, @CurrentUser() user: AuthenticatedUser): Promise<MenuDTO> {
    return this.menuService.createMenu({
      ...input,
      restaurantId: user.restaurantId,
    } satisfies CreateMenuInput);
  }

  @Patch('menus/:menuId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateMenu(
    @Param('menuId') menuId: string,
    @Body() input: UpdateMenuDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MenuDTO> {
    return this.menuService.updateMenu(menuId, user.restaurantId, input satisfies UpdateMenuInput);
  }

  @Delete('menus/:menuId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  archiveMenu(@Param('menuId') menuId: string, @CurrentUser() user: AuthenticatedUser): Promise<MenuDTO> {
    return this.menuService.archiveMenu(menuId, user.restaurantId);
  }

  @Post('menu-items')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createMenuItem(
    @Body() input: CreateMenuItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MenuItemDTO> {
    return this.menuService.createMenuItem({
      ...input,
      restaurantId: user.restaurantId,
    } satisfies CreateMenuItemInput);
  }

  @Patch('menu-items/:menuItemId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CHEF)
  updateMenuItem(
    @Param('menuItemId') menuItemId: string,
    @Body() input: UpdateMenuItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MenuItemDTO> {
    if (user.role === UserRole.CHEF && Object.keys(input).some((key) => key !== 'available')) {
      throw new ForbiddenException('CHEF can only update item availability');
    }

    return this.menuService.updateMenuItem(
      menuItemId,
      user.restaurantId,
      input satisfies UpdateMenuItemInput,
    );
  }

  @Delete('menu-items/:menuItemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  archiveMenuItem(@Param('menuItemId') menuItemId: string, @CurrentUser() user: AuthenticatedUser): Promise<MenuItemDTO> {
    return this.menuService.archiveMenuItem(menuItemId, user.restaurantId);
  }

  @Post('modifier-groups')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createModifierGroup(
    @Body() input: CreateModifierGroupDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ModifierGroupDTO> {
    return this.menuService.createModifierGroup({
      ...input,
      restaurantId: user.restaurantId,
    } satisfies CreateModifierGroupInput);
  }

  @Patch('modifier-groups/:modifierGroupId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateModifierGroup(
    @Param('modifierGroupId') modifierGroupId: string,
    @Body() input: UpdateModifierGroupDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ModifierGroupDTO> {
    return this.menuService.updateModifierGroup(
      modifierGroupId,
      user.restaurantId,
      input satisfies UpdateModifierGroupInput,
    );
  }

  @Delete('modifier-groups/:modifierGroupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  deleteModifierGroup(@Param('modifierGroupId') modifierGroupId: string, @CurrentUser() user: AuthenticatedUser): Promise<ModifierGroupDTO> {
    return this.menuService.deleteModifierGroup(modifierGroupId, user.restaurantId);
  }

  @Post('modifier-options')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createModifierOption(
    @Body() input: CreateModifierOptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ModifierOptionDTO> {
    return this.menuService.createModifierOption({
      ...(input as CreateModifierOptionInput & { restaurantId: string }),
      restaurantId: user.restaurantId,
    });
  }

  @Patch('modifier-options/:modifierOptionId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CHEF)
  updateModifierOption(
    @Param('modifierOptionId') modifierOptionId: string,
    @Body() input: UpdateModifierOptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ModifierOptionDTO> {
    if (user.role === UserRole.CHEF && Object.keys(input).some((key) => key !== 'available')) {
      throw new ForbiddenException('CHEF can only update modifier availability');
    }

    return this.menuService.updateModifierOption(
      modifierOptionId,
      user.restaurantId,
      input satisfies UpdateModifierOptionInput,
    );
  }

  @Delete('modifier-options/:modifierOptionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  archiveModifierOption(@Param('modifierOptionId') modifierOptionId: string, @CurrentUser() user: AuthenticatedUser): Promise<ModifierOptionDTO> {
    return this.menuService.archiveModifierOption(modifierOptionId, user.restaurantId);
  }
}
