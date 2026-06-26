import { Controller, Get, Param } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { RestaurantDTO } from '@repo/shared-types';
import { IdParamDto } from '../../common/dto/uuid-param.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(): Promise<RestaurantDTO[]> {
    return this.restaurantsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findById(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser): Promise<RestaurantDTO> {
    if (user.role === UserRole.MANAGER) {
      return this.restaurantsService.findById(user.restaurantId);
    }

    return this.restaurantsService.findById(params.id);
  }
}
