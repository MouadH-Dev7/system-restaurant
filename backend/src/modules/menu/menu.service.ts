import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
import { PrismaService } from '../../prisma/prisma.service';
import { RestaurantsService } from '../restaurants/restaurants.service';

const modifierGroupInclude = {
  options: {
    where: { available: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  },
} satisfies Prisma.ModifierGroupInclude;

const menuItemInclude = {
  modifierGroups: {
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: modifierGroupInclude,
  },
} satisfies Prisma.MenuItemInclude;

@Injectable()
export class MenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async getMenus(restaurantId: string): Promise<MenuDTO[]> {
    await this.restaurantsService.validateRestaurant(restaurantId);

    return this.prisma.menu.findMany({
      where: { restaurantId, active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getMenuItems(
    restaurantId: string,
    menuId?: string,
    options?: {
      availableOnly?: boolean;
      activeMenusOnly?: boolean;
    },
  ): Promise<MenuItemDTO[]> {
    await this.restaurantsService.validateRestaurant(restaurantId);

    if (menuId) {
      await this.validateMenu(menuId, restaurantId);
    }

    return this.prisma.menuItem.findMany({
      where: {
        restaurantId,
        ...(menuId ? { menuId } : {}),
        ...(options?.availableOnly ? { available: true } : {}),
        ...(options?.activeMenusOnly ? { menu: { is: { active: true } } } : {}),
      },
      include: menuItemInclude,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createMenu(input: CreateMenuInput): Promise<MenuDTO> {
    await this.restaurantsService.validateRestaurant(input.restaurantId);

    return this.prisma.menu.create({
      data: {
        restaurantId: input.restaurantId,
        name: input.name.trim(),
        nameEn: this.cleanOptional(input.nameEn),
        nameFr: this.cleanOptional(input.nameFr),
        nameAr: this.cleanOptional(input.nameAr),
        description: this.cleanOptional(input.description),
        descriptionEn: this.cleanOptional(input.descriptionEn),
        descriptionFr: this.cleanOptional(input.descriptionFr),
        descriptionAr: this.cleanOptional(input.descriptionAr),
        image: this.cleanOptional(input.image),
        heroImage: this.cleanOptional(input.heroImage),
        themeKey: this.cleanOptional(input.themeKey),
        sortOrder: input.sortOrder ?? 0,
        active: input.active ?? true,
      },
    });
  }

  async updateMenu(menuId: string, restaurantId: string, input: UpdateMenuInput): Promise<MenuDTO> {
    const existing = await this.prisma.menu.findFirst({
      where: { id: menuId, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Menu not found');
    }

    return this.prisma.menu.update({
      where: { id: menuId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.nameEn !== undefined ? { nameEn: this.cleanOptional(input.nameEn) } : {}),
        ...(input.nameFr !== undefined ? { nameFr: this.cleanOptional(input.nameFr) } : {}),
        ...(input.nameAr !== undefined ? { nameAr: this.cleanOptional(input.nameAr) } : {}),
        ...(input.description !== undefined
          ? { description: this.cleanOptional(input.description) }
          : {}),
        ...(input.descriptionEn !== undefined
          ? { descriptionEn: this.cleanOptional(input.descriptionEn) }
          : {}),
        ...(input.descriptionFr !== undefined
          ? { descriptionFr: this.cleanOptional(input.descriptionFr) }
          : {}),
        ...(input.descriptionAr !== undefined
          ? { descriptionAr: this.cleanOptional(input.descriptionAr) }
          : {}),
        ...(input.image !== undefined ? { image: this.cleanOptional(input.image) } : {}),
        ...(input.heroImage !== undefined
          ? { heroImage: this.cleanOptional(input.heroImage) }
          : {}),
        ...(input.themeKey !== undefined ? { themeKey: this.cleanOptional(input.themeKey) } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
  }

  async archiveMenu(menuId: string, restaurantId: string): Promise<MenuDTO> {
    await this.validateMenu(menuId, restaurantId);

    return this.prisma.menu.update({
      where: { id: menuId },
      data: { active: false },
    });
  }

  async createMenuItem(input: CreateMenuItemInput): Promise<MenuItemDTO> {
    await this.restaurantsService.validateRestaurant(input.restaurantId);
    await this.validateMenu(input.menuId, input.restaurantId);

    return this.prisma.menuItem.create({
      data: {
        restaurantId: input.restaurantId,
        menuId: input.menuId,
        name: input.name.trim(),
        nameEn: this.cleanOptional(input.nameEn),
        nameFr: this.cleanOptional(input.nameFr),
        nameAr: this.cleanOptional(input.nameAr),
        description: this.cleanOptional(input.description),
        descriptionEn: this.cleanOptional(input.descriptionEn),
        descriptionFr: this.cleanOptional(input.descriptionFr),
        descriptionAr: this.cleanOptional(input.descriptionAr),
        price: input.price,
        image: this.cleanOptional(input.image),
        available: input.available ?? true,
        featured: input.featured ?? false,
        badge: this.cleanOptional(input.badge),
        badgeEn: this.cleanOptional(input.badgeEn),
        badgeFr: this.cleanOptional(input.badgeFr),
        badgeAr: this.cleanOptional(input.badgeAr),
        sortOrder: input.sortOrder ?? 0,
      },
      include: menuItemInclude,
    });
  }

  async updateMenuItem(
    menuItemId: string,
    restaurantId: string,
    input: UpdateMenuItemInput,
  ): Promise<MenuItemDTO> {
    const existing = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Menu item not found');
    }

    if (input.menuId) {
      await this.validateMenu(input.menuId, existing.restaurantId);
    }

    return this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        ...(input.menuId !== undefined ? { menuId: input.menuId } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.nameEn !== undefined ? { nameEn: this.cleanOptional(input.nameEn) } : {}),
        ...(input.nameFr !== undefined ? { nameFr: this.cleanOptional(input.nameFr) } : {}),
        ...(input.nameAr !== undefined ? { nameAr: this.cleanOptional(input.nameAr) } : {}),
        ...(input.description !== undefined
          ? { description: this.cleanOptional(input.description) }
          : {}),
        ...(input.descriptionEn !== undefined
          ? { descriptionEn: this.cleanOptional(input.descriptionEn) }
          : {}),
        ...(input.descriptionFr !== undefined
          ? { descriptionFr: this.cleanOptional(input.descriptionFr) }
          : {}),
        ...(input.descriptionAr !== undefined
          ? { descriptionAr: this.cleanOptional(input.descriptionAr) }
          : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.image !== undefined ? { image: this.cleanOptional(input.image) } : {}),
        ...(input.available !== undefined ? { available: input.available } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.badge !== undefined ? { badge: this.cleanOptional(input.badge) } : {}),
        ...(input.badgeEn !== undefined ? { badgeEn: this.cleanOptional(input.badgeEn) } : {}),
        ...(input.badgeFr !== undefined ? { badgeFr: this.cleanOptional(input.badgeFr) } : {}),
        ...(input.badgeAr !== undefined ? { badgeAr: this.cleanOptional(input.badgeAr) } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
      include: menuItemInclude,
    });
  }

  async archiveMenuItem(menuItemId: string, restaurantId: string): Promise<MenuItemDTO> {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, restaurantId },
      include: menuItemInclude,
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: { available: false },
      include: menuItemInclude,
    });
  }

  async createModifierGroup(input: CreateModifierGroupInput): Promise<ModifierGroupDTO> {
    await this.restaurantsService.validateRestaurant(input.restaurantId);
    await this.validateMenuItem(input.menuItemId, input.restaurantId);

    const maxSelections = Math.max(input.maxSelections ?? 1, 1);
    const minSelections = Math.max(0, input.minSelections ?? 0);

    if (minSelections > maxSelections) {
      throw new NotFoundException('Modifier group minimum selections cannot exceed maximum');
    }

    return this.prisma.modifierGroup.create({
      data: {
        restaurantId: input.restaurantId,
        menuItemId: input.menuItemId,
        name: input.name.trim(),
        nameEn: this.cleanOptional(input.nameEn),
        nameFr: this.cleanOptional(input.nameFr),
        nameAr: this.cleanOptional(input.nameAr),
        description: this.cleanOptional(input.description),
        descriptionEn: this.cleanOptional(input.descriptionEn),
        descriptionFr: this.cleanOptional(input.descriptionFr),
        descriptionAr: this.cleanOptional(input.descriptionAr),
        required: input.required ?? false,
        minSelections,
        maxSelections,
        sortOrder: input.sortOrder ?? 0,
      },
      include: modifierGroupInclude,
    });
  }

  async updateModifierGroup(
    modifierGroupId: string,
    restaurantId: string,
    input: UpdateModifierGroupInput,
  ): Promise<ModifierGroupDTO> {
    const existing = await this.prisma.modifierGroup.findFirst({
      where: { id: modifierGroupId, restaurantId },
      include: modifierGroupInclude,
    });

    if (!existing) {
      throw new NotFoundException('Modifier group not found');
    }

    const nextMaxSelections = Math.max(input.maxSelections ?? existing.maxSelections, 1);
    const nextMinSelections = Math.max(0, input.minSelections ?? existing.minSelections);

    if (nextMinSelections > nextMaxSelections) {
      throw new NotFoundException('Modifier group minimum selections cannot exceed maximum');
    }

    return this.prisma.modifierGroup.update({
      where: { id: modifierGroupId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.nameEn !== undefined ? { nameEn: this.cleanOptional(input.nameEn) } : {}),
        ...(input.nameFr !== undefined ? { nameFr: this.cleanOptional(input.nameFr) } : {}),
        ...(input.nameAr !== undefined ? { nameAr: this.cleanOptional(input.nameAr) } : {}),
        ...(input.description !== undefined
          ? { description: this.cleanOptional(input.description) }
          : {}),
        ...(input.descriptionEn !== undefined
          ? { descriptionEn: this.cleanOptional(input.descriptionEn) }
          : {}),
        ...(input.descriptionFr !== undefined
          ? { descriptionFr: this.cleanOptional(input.descriptionFr) }
          : {}),
        ...(input.descriptionAr !== undefined
          ? { descriptionAr: this.cleanOptional(input.descriptionAr) }
          : {}),
        ...(input.required !== undefined ? { required: input.required } : {}),
        minSelections: nextMinSelections,
        maxSelections: nextMaxSelections,
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
      include: modifierGroupInclude,
    });
  }

  async deleteModifierGroup(modifierGroupId: string, restaurantId: string): Promise<ModifierGroupDTO> {
    const existing = await this.prisma.modifierGroup.findFirst({
      where: { id: modifierGroupId, restaurantId },
      include: modifierGroupInclude,
    });

    if (!existing) {
      throw new NotFoundException('Modifier group not found');
    }

    await this.prisma.modifierGroup.delete({
      where: { id: modifierGroupId },
    });

    return existing;
  }

  async createModifierOption(
    input: CreateModifierOptionInput & { restaurantId: string },
  ): Promise<ModifierOptionDTO> {
    const group = await this.prisma.modifierGroup.findFirst({
      where: {
        id: input.groupId,
        restaurantId: input.restaurantId,
      },
      select: { id: true, maxSelections: true },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    return this.prisma.modifierOption.create({
      data: {
        groupId: input.groupId,
        name: input.name.trim(),
        nameEn: this.cleanOptional(input.nameEn),
        nameFr: this.cleanOptional(input.nameFr),
        nameAr: this.cleanOptional(input.nameAr),
        description: this.cleanOptional(input.description),
        descriptionEn: this.cleanOptional(input.descriptionEn),
        descriptionFr: this.cleanOptional(input.descriptionFr),
        descriptionAr: this.cleanOptional(input.descriptionAr),
        priceDelta: input.priceDelta ?? 0,
        available: input.available ?? true,
        isDefault: input.isDefault ?? false,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async updateModifierOption(
    modifierOptionId: string,
    restaurantId: string,
    input: UpdateModifierOptionInput,
  ): Promise<ModifierOptionDTO> {
    const existing = await this.prisma.modifierOption.findFirst({
      where: {
        id: modifierOptionId,
        group: {
          restaurantId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Modifier option not found');
    }

    return this.prisma.modifierOption.update({
      where: { id: modifierOptionId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.nameEn !== undefined ? { nameEn: this.cleanOptional(input.nameEn) } : {}),
        ...(input.nameFr !== undefined ? { nameFr: this.cleanOptional(input.nameFr) } : {}),
        ...(input.nameAr !== undefined ? { nameAr: this.cleanOptional(input.nameAr) } : {}),
        ...(input.description !== undefined
          ? { description: this.cleanOptional(input.description) }
          : {}),
        ...(input.descriptionEn !== undefined
          ? { descriptionEn: this.cleanOptional(input.descriptionEn) }
          : {}),
        ...(input.descriptionFr !== undefined
          ? { descriptionFr: this.cleanOptional(input.descriptionFr) }
          : {}),
        ...(input.descriptionAr !== undefined
          ? { descriptionAr: this.cleanOptional(input.descriptionAr) }
          : {}),
        ...(input.priceDelta !== undefined ? { priceDelta: input.priceDelta } : {}),
        ...(input.available !== undefined ? { available: input.available } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
  }

  async archiveModifierOption(
    modifierOptionId: string,
    restaurantId: string,
  ): Promise<ModifierOptionDTO> {
    const existing = await this.prisma.modifierOption.findFirst({
      where: {
        id: modifierOptionId,
        group: {
          restaurantId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Modifier option not found');
    }

    return this.prisma.modifierOption.update({
      where: { id: modifierOptionId },
      data: { available: false, isDefault: false },
    });
  }

  private async validateMenu(menuId: string, restaurantId: string) {
    const menu = await this.prisma.menu.findFirst({
      where: { id: menuId, restaurantId, active: true },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return menu;
  }

  async validateMenuItems(menuItemIds: string[], restaurantId: string): Promise<MenuItemDTO[]> {
    const uniqueIds = [...new Set(menuItemIds)];
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: uniqueIds },
        restaurantId,
        available: true,
      },
      include: menuItemInclude,
    });

    if (menuItems.length !== uniqueIds.length) {
      throw new NotFoundException('One or more menu items were not found');
    }

    return menuItems;
  }

  private async validateMenuItem(menuItemId: string, restaurantId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, restaurantId },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }

  private cleanOptional(value: string | null | undefined) {
    if (typeof value !== 'string') {
      return value ?? null;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
}
