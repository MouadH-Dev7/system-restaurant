import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertUserBelongsToRestaurant(userId: string, restaurantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        restaurantId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found in this restaurant');
    }
  }
}
