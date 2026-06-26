import { Injectable, NotFoundException } from '@nestjs/common';
import type { RestaurantDTO } from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RestaurantDTO[]> {
    const restaurants = await this.prisma.restaurant.findMany({ orderBy: { createdAt: 'asc' } });
    return restaurants.map((restaurant) => ({
      ...restaurant,
      createdAt: restaurant.createdAt.toISOString(),
    }));
  }

  async findById(id: string): Promise<RestaurantDTO> {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return {
      ...restaurant,
      createdAt: restaurant.createdAt.toISOString(),
    };
  }

  async validateRestaurant(id: string) {
    await this.findById(id);
  }
}
